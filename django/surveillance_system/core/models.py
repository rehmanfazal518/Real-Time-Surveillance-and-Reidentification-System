from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    ADMIN = 'Admin'
    STAFF = 'Staff'
    PARENT = 'Parent'
    ROLE_CHOICES = [
        (ADMIN, 'Admin'),
        (STAFF, 'Staff'),
        (PARENT, 'Parent'),
    ]

    role = models.CharField(max_length=6, choices=ROLE_CHOICES, default=STAFF)
    mobile_number = models.CharField(max_length=15, null=True, blank=True)
    cnic = models.CharField(max_length=15, unique=True, null=True, blank=True)
    current_address = models.TextField(null=True, blank=True)
    permanent_address = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.username


class Camera(models.Model):
    camera_id = models.AutoField(primary_key=True)
    location = models.CharField(max_length=255)
    ip = models.CharField(max_length=500)
    status = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.location


class ReidLog(models.Model):
    EVENT_TYPES = [
        ('new_id', 'New ID'),
        ('rename', 'Rename ID'),
        ('gallery_loaded', 'Gallery Loaded'),
        ('gallery_saved', 'Gallery Saved'),
        ('reid_detected', 'ReID Detected'),
        ('disappearance', 'Disappearance'),
    ]

    timestamp = models.DateTimeField(default=timezone.now)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    message = models.TextField()
    camera = models.ForeignKey(Camera, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}] {self.event_type}: {self.message}"

class ChildProfile(models.Model):
    pid = models.IntegerField(unique=True)
    name = models.CharField(max_length=100)
    parent = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.name} (PID: {self.pid})"