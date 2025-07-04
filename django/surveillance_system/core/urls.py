from django.urls import path
from .views import auth, user, camera, reid

urlpatterns = [
    # Auth
    path('login/', auth.login_user, name='login'),
    path('logout/', auth.logout_user, name='logout'),
    path('request-password-reset/', auth.request_password_reset, name='request_password_reset'),
    path('reset-password/', auth.reset_password, name='reset_password'),
    path('password-reset-confirm/<str:uidb64>/<str:token>/', auth.password_reset_confirm, name='password_reset_confirm'),

    # Users
    path('users/', user.user_list, name='user_list'),
    path('add_user/', user.add_user, name='add_user'),
    path('users/<int:user_id>/', user.delete_user, name='delete_user'),
    path('users/update/', user.update_user, name='update_user'),
    path('current_user/', auth.current_user, name='current_user'),
    path('change_password/', auth.change_password, name='change_password'),

    # Cameras
    path('cameras/', camera.camera_list, name='camera_list'),
    path('add_camera/', camera.add_camera, name='add_camera'),
    path('cameras/<int:camera_id>/', camera.delete_camera, name='delete_camera'),
    path('edit_camera/<int:camera_id>/', camera.edit_camera, name='edit_camera'),

    # ReID
    path('stream-camera/<int:camera_id>/', reid.stream_camera_feed, name='stream_camera_feed'),
    path('reid/rename-id/', reid.rename_person_id, name='rename_person_id'),
    path('reid/activity-stream/', reid.reid_activity_stream, name='reid_activity_stream'),
]
