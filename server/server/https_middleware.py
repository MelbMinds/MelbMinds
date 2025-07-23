from django.http import HttpResponsePermanentRedirect

class ForceHTTPSMiddleware:
    """Middleware to force all non-HTTPS requests to HTTPS"""
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Check if we should force HTTPS
        if not request.is_secure():
            # Get the current URL
            url = request.build_absolute_uri()
            # Replace http with https
            secure_url = url.replace("http://", "https://", 1)
            # Perform permanent redirect
            return HttpResponsePermanentRedirect(secure_url)
            
        # Continue processing the request
        response = self.get_response(request)
        
        # Ensure Content-Security-Policy header to prevent mixed content
        if 'Content-Security-Policy' not in response:
            response['Content-Security-Policy'] = "upgrade-insecure-requests"
            
        return response
