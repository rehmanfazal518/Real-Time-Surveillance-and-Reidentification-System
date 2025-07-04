import json
import time
from django.http import StreamingHttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from core.models import Camera, ReidLog, ChildProfile
from core.utils.reid_processor import reid_video_stream, GLOBAL_REID_MODEL
from django.utils.timezone import localtime


def stream_camera_feed(request, camera_id):
    try:
        cam = Camera.objects.get(camera_id=camera_id)
    except Camera.DoesNotExist:
        return JsonResponse({"error": "Camera not found"}, status=404)

    return StreamingHttpResponse(
        reid_video_stream(cam.ip),
        content_type='multipart/x-mixed-replace; boundary=frame'
    )

@csrf_exempt
def rename_person_id(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request"}, status=400)

    data = json.loads(request.body)
    pid = data.get("pid")
    name = data.get("name")
    parent_email = data.get("parent_email")
    parent_username = data.get("parent_username")

    if pid is None or not name or (not parent_email and not parent_username):
        return JsonResponse({"error": "pid, name, and parent identifier required"}, status=400)

    # Lookup parent
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        parent = (
            User.objects.get(email=parent_email, role="Parent")
            if parent_email else
            User.objects.get(username=parent_username, role="Parent")
        )
    except User.DoesNotExist:
        return JsonResponse({"error": "Parent user name or email not found"}, status=404)

    # Rename in memory
    GLOBAL_REID_MODEL.rename_id(int(pid), name)
    GLOBAL_REID_MODEL.save_gallery()

    # Save to DB
    profile, created = ChildProfile.objects.update_or_create(
        pid=pid,
        defaults={"name": name, "parent": parent}
    )

    return JsonResponse({
        "message": f"ID {pid} renamed to {name} and linked to {parent.username}",
        "new": created
    })

def event_stream():
    last_id = 0
    while True:
        logs = ReidLog.objects.filter(id__gt=last_id).order_by('id')
        for log in logs:
            last_id = log.id
            data = {
                "timestamp": localtime(log.timestamp).strftime("%Y-%m-%d %H:%M:%S"),
                "type": log.event_type,
                "message": log.message,
                "camera": log.camera.location if log.camera else None
            }
            yield f"data: {json.dumps(data)}\n\n"
        time.sleep(1)
        

def reid_activity_stream(request):
    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    return response