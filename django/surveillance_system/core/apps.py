# core/apps.py
from django.apps import AppConfig
import os
import atexit

import threading

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        if os.environ.get('RUN_MAIN') == 'true':
            from core.utils.reid_processor import start_reid_for_all_cameras,stop_all_video_processing
            threading.Thread(target=start_reid_for_all_cameras, daemon=True).start()    
            atexit.register(stop_all_video_processing)