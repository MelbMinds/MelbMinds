import time
from django.utils import timezone
from .views import cleanup_past_sessions
from django.http import HttpResponse

class SessionCleanupMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.last_cleanup = 0
        self.cleanup_interval = 60  # 1 minute

    def __call__(self, request):
        # Check if we should run cleanup (every minute)
        current_time = time.time()
        if current_time - self.last_cleanup > self.cleanup_interval:
            cleanup_past_sessions()
            self.last_cleanup = current_time
        
        response = self.get_response(request)
        return response 

class CORSMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Handle preflight OPTIONS requests
        if request.method == "OPTIONS":
            response = HttpResponse()
            response["Content-Length"] = "0"
            return response
        
        response = self.get_response(request)
        return response