from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model

User = get_user_model()

@csrf_exempt
def add_user(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Invalid request"}, status=400)

    username = request.POST.get('username')
    email = request.POST.get('email')
    password = request.POST.get('password')
    role = request.POST.get('role')
    mobile_number = request.POST.get('mobile_number')
    cnic = request.POST.get('cnic')
    current_address = request.POST.get('current_address')
    permanent_address = request.POST.get('permanent_address')

    if not all([username, email, password, role]):
        return JsonResponse({'success': False, 'message': 'All fields are required'}, status=400)

    try:
        user = User.objects.create_user(username=username, email=email, password=password)
        user.role = role
        user.mobile_number = mobile_number
        user.cnic = cnic
        user.current_address = current_address
        user.permanent_address = permanent_address
        user.save()
        return JsonResponse({'success': True, 'message': 'User added successfully'}, status=201)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


def user_list(request):
    users = User.objects.all()
    data = list(users.values(
        'id','username','email','mobile_number',
        'cnic','current_address','permanent_address','role'
    ))
    return JsonResponse({"users": data}, status=200)


@csrf_exempt
def delete_user(request, user_id):
    if request.method != "DELETE":
        return JsonResponse({"error": "Invalid request"}, status=400)
    try:
        u = User.objects.get(id=user_id)
        u.delete()
        return JsonResponse({"message": f"User {user_id} deleted"}, status=200)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)


@csrf_exempt
def update_user(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Invalid request"}, status=400)

    user_id = request.POST.get('user_id')
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'User not found'}, status=404)

    user.username = request.POST.get('username') or user.username
    user.email = request.POST.get('email') or user.email
    user.mobile_number = request.POST.get('mobile_number') or user.mobile_number
    user.cnic = request.POST.get('cnic') or user.cnic
    user.current_address = request.POST.get('current_address') or user.current_address
    user.permanent_address = request.POST.get('permanent_address') or user.permanent_address
    user.role = request.POST.get('role') or user.role
    user.save()
    return JsonResponse({'success': True, 'message': 'User updated'}, status=200)
