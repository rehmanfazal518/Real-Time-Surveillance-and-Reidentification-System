import json
import secrets
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
from django.core.cache import cache

User = get_user_model()

# Custom token generator for password reset
class TokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        return (
            str(user.pk) + str(timestamp) + str(user.is_active)
        )

account_activation_token = TokenGenerator()

@csrf_exempt
def login_user(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request"}, status=400)

    data = json.loads(request.body)
    username = data.get("username")
    password = data.get("password")
    selected_role = data.get("role")

    user = authenticate(request, username=username, password=password)
    if not user:
        return JsonResponse({"error": "Invalid credentials"}, status=401)

    # Role checks (preserved from your original logic)
    if user.role == "Admin" and selected_role in ["Admin", "Staff"]:
        login(request, user)
        redirect = "admin_dashboard.html" if selected_role == "Admin" else "dashboard.html"
    elif user.role == "Staff" and selected_role == "Staff":
        login(request, user)
        redirect = "dashboard.html"
    elif user.role == "Parent" and selected_role == "Parent":
        login(request, user)
        redirect = None
    else:
        return JsonResponse({"error": "Role mismatch"}, status=403)

    # 🔐 Generate and store token
    token = secrets.token_urlsafe(32)
    cache.set(f"auth_token:{token}", user.id, timeout=86400)  # 24 hours

    response_data = {
        "message": "Login successful",
        "redirect_url": redirect,
        "token": token  # ✅ New field
    }
    return JsonResponse(response_data, status=200)

@csrf_exempt
def logout_user(request):
    # Clear token if sent
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        cache.delete(f"auth_token:{token}")

    # Also log out the session (optional)
    logout(request)
    return JsonResponse({"message": "Logged out successfully"}, status=200)

@csrf_exempt
def current_user(request):
    # Authenticate using token
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return JsonResponse({"error": "Token missing"}, status=401)

    token = auth_header.split(" ")[1]
    user_id = cache.get(f"auth_token:{token}")
    if not user_id:
        return JsonResponse({"error": "Invalid or expired token"}, status=401)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    return JsonResponse({
        "user": {
            "username": user.username,
            "email": user.email,
            "mobile_number": user.mobile_number,
            "cnic": user.cnic,
            "current_address": user.current_address,
            "permanent_address": user.permanent_address,
            "role": user.role
        }
    })

@csrf_exempt
def change_password(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request"}, status=400)

    try:
        data = request.POST if request.POST else json.loads(request.body)
    except:
        data = request.POST

    current_password = data.get('current_password')
    new_password = data.get('new_password')
    confirm_password = data.get('confirm_password')

    if not all([current_password, new_password, confirm_password]):
        return JsonResponse({"error": "All fields are required"}, status=400)

    if new_password != confirm_password:
        return JsonResponse({"error": "New passwords do not match"}, status=400)

    # Token-based authentication
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return JsonResponse({"error": "Token missing"}, status=401)

    token = auth_header.split(" ")[1]
    user_id = cache.get(f"auth_token:{token}")
    if not user_id:
        return JsonResponse({"error": "Invalid or expired token"}, status=401)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    if not user.check_password(current_password):
        return JsonResponse({"error": "Current password is incorrect"}, status=400)

    try:
        user.set_password(new_password)
        user.save()
        return JsonResponse({"message": "Password changed successfully"}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def request_password_reset(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request"}, status=400)

    data = json.loads(request.body)
    username = data.get("username")

    try:
        user = User.objects.get(username=username)

        # Generate a temporary password
        temp_password = secrets.token_urlsafe(12)

        # Set and save the hashed password
        user.set_password(temp_password)
        user.save()

        # Email the temporary password
        subject = "Your Temporary Password"
        message = f"""
        Hello {user.username},

        Use this temporary password to log in: 
        {temp_password}

        You must change it immediately after logging in.
        """

        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
        return JsonResponse({"message": "Temporary password sent"}, status=200)

    except User.DoesNotExist:
        return JsonResponse({"message": "If this user exists, an email was sent"}, status=200)
    except Exception as e:
        return JsonResponse({"error": f"Error: {str(e)}"}, status=500)

@csrf_exempt
def password_reset_confirm(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    if user is not None and account_activation_token.check_token(user, token):
        reset_url = f"http://localhost:8080/reset_password.html?uidb64={uidb64}&token={token}"
        return JsonResponse({"valid": True, "reset_url": reset_url}, status=200)
    else:
        return JsonResponse({"valid": False, "error": "Invalid reset link"}, status=400)

@csrf_exempt
def reset_password(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request"}, status=400)

    data = json.loads(request.body)
    uidb64 = data.get("uidb64")
    token = data.get("token")
    new_password = data.get("new_password")

    if not all([uidb64, token, new_password]):
        return JsonResponse({"error": "All fields are required"}, status=400)

    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)

        if not account_activation_token.check_token(user, token):
            return JsonResponse({"error": "Invalid or expired token"}, status=400)

        user.set_password(new_password)
        user.save()

        return JsonResponse({"message": "Password has been reset successfully"}, status=200)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return JsonResponse({"error": "Invalid reset link"}, status=400)
    except Exception as e:
        return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=500)
