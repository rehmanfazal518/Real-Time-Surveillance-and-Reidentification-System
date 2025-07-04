import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from core.models import Camera

@csrf_exempt
def add_camera(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Invalid request"}, status=400)

    location = request.POST.get('location')
    ip = request.POST.get('ip')
    if not location or not ip:
        return JsonResponse({'success': False, 'message': 'Location and IP required'}, status=400)

    cam = Camera(location=location, ip=ip)
    cam.save()
    return JsonResponse({'success': True, 'message': 'Camera added'}, status=201)

def camera_list(request):
    cams = Camera.objects.all()
    data = list(cams.values('camera_id','location','ip','status'))
    return JsonResponse({"cameras": data}, status=200)

@csrf_exempt
def delete_camera(request, camera_id):
    if request.method != "DELETE":
        return JsonResponse({"error": "Invalid request"}, status=400)
    try:
        Camera.objects.get(camera_id=camera_id).delete()
        return JsonResponse({"message": "Camera deleted"}, status=200)
    except Camera.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)

@csrf_exempt
def edit_camera(request, camera_id):
    if request.method != "PUT":
        return JsonResponse({"success": False, "message": "Invalid method"}, status=400)
    try:
        cam = Camera.objects.get(camera_id=camera_id)
    except Camera.DoesNotExist:
        return JsonResponse({"success": False, "message": "Not found"}, status=404)

    data = json.loads(request.body)
    cam.location = data.get('location', cam.location)
    cam.ip = data.get('ip', cam.ip)
    cam.status = data.get('status', cam.status)
    cam.save()
    return JsonResponse({'success': True, 'message': 'Camera updated'}, status=200)
