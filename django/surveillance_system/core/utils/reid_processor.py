import os
import cv2
from datetime import datetime
import time
import torch
import threading
import numpy as np
from PIL import Image
from scipy.spatial import distance
from scipy.optimize import linear_sum_assignment
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort
from torchreid.reid.models import build_model
from torchreid.reid.data.transforms import build_transforms
import pickle
from core.models import ReidLog, Camera
from cv2 import imencode

LIVE_FRAME_BUFFERS = {}
VIDEO_WRITERS = {}
VIDEO_CAPTURES = {}

GALLERY_PATH = "core/utils/reid_gallery.pkl"
REID_THRESHOLD = 0.75
ALPHA = 0.3
TEMPORAL_FRAMES = 10
MAX_GALLERY_SIZE = 512

class STReID:
    def __init__(self, alpha=0.3, threshold=0.6, temporal_frames=3, max_gallery_size=100):
        self.alpha = alpha
        self.threshold = threshold
        self.temporal_frames = temporal_frames
        self.max_gallery_size = max_gallery_size
        self.lock = threading.Lock()

        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        if torch.cuda.is_available():
            self.model = build_model(
                name='resnet50',
                num_classes=751,
                pretrained=True
            ).to(self.device)
        else:
            self.model = build_model(
                name='osnet_x1_0',
                num_classes=751,
                pretrained=True
            )
        self.model.eval()

        self.transform = build_transforms(
            height=256,
            width=128,
            norm_mean=[0.485, 0.456, 0.406],
            norm_std=[0.229, 0.224, 0.225],
        )[1]

        self.tracked_persons = {}
        self.next_id = 0
        self.color_map = {}

    def extract_features(self, bgr_imgs):
        batch = []
        for img in bgr_imgs:
            if img is None or img.size == 0:
                continue
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            img_pil = Image.fromarray(img_rgb)
            img_t = self.transform(img_pil).unsqueeze(0)
            batch.append(img_t)

        if not batch:
            return np.empty((0, 2048))

        with torch.no_grad(), self.lock:
            batch_t = torch.cat(batch).to(self.device)
            feats = self.model(batch_t).cpu().numpy()

        norms = np.linalg.norm(feats, axis=1, keepdims=True) + 1e-12
        return feats / norms

    def match_batch(self, feats):
        with self.lock:
            if not self.tracked_persons:
                return [self._create_id(f) for f in feats]

            pids = list(self.tracked_persons.keys())
            gallery_feats = np.array([p['features'].mean(0) for p in self.tracked_persons.values()])

            cos_dists = distance.cdist(feats, gallery_feats, 'cosine')
            euc_dists = distance.cdist(feats, gallery_feats, 'euclidean')
            cost_matrix = self.alpha * cos_dists + (1 - self.alpha) * euc_dists

            row_idx, col_idx = linear_sum_assignment(cost_matrix)
            assignments = [None] * len(feats)

            for r, c in zip(row_idx, col_idx):
                if cost_matrix[r, c] < self.threshold:
                    pid = pids[c]
                    assignments[r] = pid
                    self._update_gallery(pid, feats[r])
                else:
                    assignments[r] = self._create_id(feats[r])

            for i in range(len(assignments)):
                if assignments[i] is None:
                    assignments[i] = self._create_id(feats[i])

            return assignments

    def _create_id(self, feat):
        pid = self.next_id
        self.next_id += 1

        
        np.random.seed(pid)
        color = tuple(np.random.randint(0, 255, 3).tolist())
        np.random.seed()

        self.color_map[pid] = color
        self.tracked_persons[pid] = {
            'features': np.array([feat]),
            'temp_frames': 0,
            'name': None,
            'color': color
        }
        
        self.log_event('new_id', f"New child detected. Assigned ID: {pid}")
        
        threading.Thread(target=self.save_gallery, daemon=True).start()
        return pid

    def _update_gallery(self, pid, feat):
        entry = self.tracked_persons[pid]
        features = entry['features']
        entry['features'] = np.vstack((features[-(self.max_gallery_size - 1):], feat))
        entry['temp_frames'] = min(entry['temp_frames'] + 1, self.temporal_frames)

    def set_threshold(self, val):
        with self.lock:
            self.threshold = float(val)

    def rename_id(self, pid, new_name):
        with self.lock:
            if pid in self.tracked_persons:
                self.tracked_persons[pid]['name'] = new_name
                print(f"Renamed ID {pid} to {new_name}")
                self.log_event('rename', f"ID {pid} renamed to {new_name}", camera=None) 
            
    def save_gallery(self):
        print("[REID] Saving gallery to disk")
        with self.lock:
            safe_persons = {}
            for pid, data in self.tracked_persons.items():
                safe_persons[pid] = {
                    'features': data['features'].tolist(),
                    'temp_frames': data['temp_frames'],
                    'name': data['name'],
                    'color': data['color'],
                    'seen_cameras': list(data.get('seen_cameras', []))
                }

            with open(GALLERY_PATH, 'wb') as f:
                pickle.dump({
                    'tracked_persons': safe_persons,
                    'next_id': self.next_id
                }, f)

            self.log_event('gallery_saved', f"Gallery saved with {len(safe_persons)} entries.")

    def load_gallery(self):
        try:
            with open(GALLERY_PATH, 'rb') as f:
                data = pickle.load(f)
                self.tracked_persons = {}
                for pid, entry in data['tracked_persons'].items():
                    self.tracked_persons[pid] = {
                        'features': np.array(entry['features']),
                        'temp_frames': entry['temp_frames'],
                        'name': entry['name'],
                        'color': tuple(entry['color']),
                        'seen_cameras': set(entry.get('seen_cameras', []))
                    }
                self.next_id = data['next_id']
            self.log_event('gallery_loaded', f"Gallery loaded with {len(self.tracked_persons)} entries.")
        except FileNotFoundError:
            print("No saved gallery found. Starting fresh.")
    def log_event(self, event_type, message, camera=None):
        log_entry = ReidLog(event_type=event_type, message=message, camera=camera)
        log_entry.save()
        print(f"[REID LOG] {event_type.upper()} - {message}")


class VideoProcessor:
    def __init__(self, video_path, st_reid, output_path=None, vid_idx=0, camera=None):
        self.camera = camera
        self.video_path = video_path
        self.st_reid = st_reid
        self.output_path = output_path
        self.vid_idx = vid_idx
        self.processing_lock = threading.Lock()
        self.running = True

        self.yolo = YOLO('yolov8n.pt')
        if torch.cuda.is_available():
            self.yolo.model.to(st_reid.device)
        self.yolo.classes = [0]

        self.tracker = DeepSort(
            max_age=30,
            n_init=2,
            max_cosine_distance=0.4,
            nn_budget=50
        )

    def process_frame(self, frame):
        with self.processing_lock:
            try:
                results = self.yolo(frame, verbose=False)[0]
                detections = []

                for box in results.boxes:
                    if box.conf.item() > 0.5 and int(box.cls.item()) == 0:
                        x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().tolist())
                        detections.append(([x1, y1, x2 - x1, y2 - y1], box.conf.item(), None))
                        
                tracks = self.tracker.update_tracks(detections, frame=frame)
                bboxes = []
                crops = []

                for trk in tracks:
                    if trk.is_confirmed() and trk.time_since_update <= 1:
                        l, t, r, b = map(int, trk.to_ltrb())
                        if (r - l) > 10 and (b - t) > 10:
                            crop = frame[t:b, l:r]
                            if crop is not None and crop.size > 0:
                                bboxes.append((l, t, r, b))
                                crops.append(crop)

                if crops:
                    feats = self.st_reid.extract_features(crops)
                    assignments = self.st_reid.match_batch(feats)
                    
                    for idx, (bbox, pid) in enumerate(zip(bboxes, assignments)):
                        l, t, r, b = bbox
                        try:
                            person_data = self.st_reid.tracked_persons[pid]
                            color = person_data['color']
                            name = person_data.get('name')
                            person_data['last_seen'] = time.time()
                            
                            name = person_data.get('name') or f"ID {pid}"
                            person_data['last_seen'] = time.time()
                            camera_name = self.camera.location if self.camera else "Unknown"
                            
                            if person_data.get('alerted'):
                                person_data['alerted'] = False
                                name = person_data.get("name") or f"ID {pid}"
                                self.st_reid.log_event("reid_reappeared", f"Child {name} detected in {camera_name}", camera=self.camera)
                                
                            if 'seen_cameras' not in person_data:
                                person_data['seen_cameras'] = set()

                            if camera_name not in person_data['seen_cameras']:
                                person_data['seen_cameras'].add(camera_name)
                                if name:
                                    message = f"Child {name} detected in {camera_name}"
                                else:
                                    message = f"Child ID {pid} detected in {camera_name}"
                                self.st_reid.log_event('reid_detected', message, camera=self.camera)
                            display_text = f"ID:{pid}" if name is None else name

                            cv2.rectangle(frame, (l, t), (r, b), color, 2)

                            (text_width, text_height), _ = cv2.getTextSize(
                                display_text,
                                cv2.FONT_HERSHEY_SIMPLEX,
                                0.6,
                                2
                            )

                            cv2.rectangle(
                                frame,
                                (l, t - text_height - 10),
                                (l + text_width, t),
                                color,
                                -1
                            )

                            cv2.putText(
                                frame,
                                display_text,
                                (l, t - 5),
                                cv2.FONT_HERSHEY_SIMPLEX,
                                0.6,
                                (255, 255, 255),
                                2
                            )
                        except KeyError:
                            print(f"Temporary tracking mismatch for PID {pid}")
                            continue
                frame_fixed = cv2.resize(frame, (640, 480), interpolation=cv2.INTER_AREA)
                LIVE_FRAME_BUFFERS[self.video_path] = frame_fixed.copy()
                return frame

            except Exception as e:
                print(f"Processing error: {e}")
                return frame

GLOBAL_REID_MODEL = STReID(
    alpha=ALPHA,
    threshold=REID_THRESHOLD,
    temporal_frames=TEMPORAL_FRAMES,
    max_gallery_size=MAX_GALLERY_SIZE
)

GLOBAL_REID_MODEL.load_gallery()


def reid_video_generator(video_path, width=640, height=480):

    OUTPUT_DIR = "output_videos"
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    cam = Camera.objects.filter(ip=video_path).first()
    cam_id = cam.camera_id if cam else "unknown"

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_filename = f"camera_{cam_id}_{timestamp}.mp4"
    output_path = os.path.join(OUTPUT_DIR, output_filename)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"[reid] Unable to open video {video_path}")
        return
    
    VIDEO_CAPTURES[video_path] = cap

    fps = cap.get(cv2.CAP_PROP_FPS) or 20
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    VIDEO_WRITERS[video_path] = writer
    
    print(f"[reid] Saving processed video to: {output_path}")

    processor = VideoProcessor(video_path, GLOBAL_REID_MODEL, output_path=output_path, vid_idx=0, camera=cam)

    while True:
        ret, frame = cap.read()
        if not ret:
            print("[reid] End of video or read error")
            break

        processed_frame = processor.process_frame(frame)
        frame_fixed = cv2.resize(processed_frame, (width, height), interpolation=cv2.INTER_AREA)

        writer.write(frame_fixed)

        
        ok, jpeg = cv2.imencode('.jpg', frame_fixed)
        if not ok:
            continue

        yield (
            b'--frame\r\n'
            b'Content-Type: image/jpeg\r\n\r\n' +
            jpeg.tobytes() +
            b'\r\n\r\n'
        )

    cap.release()
    writer.release()
    print(f"[reid] Finished writing: {output_path}")


def start_reid_for_all_cameras():
    
    threading.Thread(target=lambda: start_disappearance_monitor(threshold_seconds=1800), daemon=True).start()
    
    cams = Camera.objects.filter(status=True)
    for cam in cams:
        print(f"[INIT] Starting REID thread for {cam.location}")
        t = threading.Thread(
            target=lambda: list(reid_video_generator(cam.ip)),
            daemon=True
        )
        t.start()
        
        
def reid_video_stream(camera_ip):
    
    while True:
        frame = LIVE_FRAME_BUFFERS.get(camera_ip)
        if frame is not None:
            ok, jpeg = imencode('.jpg', frame)
            if ok:
                yield (
                    b'--frame\r\n'
                    b'Content-Type: image/jpeg\r\n\r\n' +
                    jpeg.tobytes() +
                    b'\r\n\r\n'
                )
        time.sleep(0.05)  # stream at ~20 FPS
        
def stop_all_video_processing():
    print("[REID] Cleaning up video resources...")
    for ip, writer in VIDEO_WRITERS.items():
        try:
            writer.release()
            print(f"[REID] VideoWriter released for {ip}")
        except Exception as e:
            print(f"[REID] Error releasing writer for {ip}: {e}")

    for ip, cap in VIDEO_CAPTURES.items():
        try:
            cap.release()
            print(f"[REID] VideoCapture released for {ip}")
        except Exception as e:
            print(f"[REID] Error releasing capture for {ip}: {e}")

def start_disappearance_monitor(threshold_seconds=1800):
    def monitor():
        print(f"[REID] Disappearance monitor started with threshold {threshold_seconds} seconds")
        while True:
            now_ts = time.time()
            with GLOBAL_REID_MODEL.lock:
                for pid, data in GLOBAL_REID_MODEL.tracked_persons.items():
                    last_seen = data.get('last_seen')
                    name = data.get('name') or f"ID {pid}"

                    if not last_seen or now_ts - last_seen < threshold_seconds:
                        continue

                    if data.get('alerted'):
                        continue

                    data['alerted'] = True

                    GLOBAL_REID_MODEL.log_event(
                        'disappearance',
                        f"Child {name} has not been seen for over {threshold_seconds // 60} minutes.",
                        camera=None
                    )

                    try:
                        from core.models import ChildProfile
                        profile = ChildProfile.objects.get(pid=pid)
                        parent_email = profile.parent.email

                        from django.core.mail import send_mail
                        send_mail(
                            subject="Alert: Child Missing in Fun House",
                            message=f"Your child '{name}' has not been detected on any camera for the last {threshold_seconds // 60} minutes.",
                            from_email="noreply@funhouse.com",
                            recipient_list=[parent_email],
                            fail_silently=True
                        )
                        print(f"[ALERT] Email sent to parent of {name}")
                    except ChildProfile.DoesNotExist:
                        print(f"[WARN] No parent found for PID {pid}")
                    except Exception as e:
                        print(f"[ERROR] Email send failed: {e}")
            time.sleep(30)

    threading.Thread(target=monitor, daemon=True).start()