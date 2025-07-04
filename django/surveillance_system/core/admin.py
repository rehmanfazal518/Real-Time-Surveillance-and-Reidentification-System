from django.contrib import admin
from .models import User, Camera, ReidLog

admin.site.register(User)
admin.site.register(Camera)
admin.site.register(ReidLog)