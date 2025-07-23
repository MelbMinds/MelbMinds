import os
import logging
from django.conf import settings
import boto3
from botocore.exceptions import ClientError
from storages.backends.s3boto3 import S3Boto3Storage

# Set up logging
logger = logging.getLogger(__name__)

class CustomS3Storage(S3Boto3Storage):
    """
    Custom S3 storage class that can generate presigned URLs
    """
    def __init__(self, *args, **kwargs):
        # Override default ACL settings to ensure proper access
        kwargs.setdefault('querystring_auth', True)  # Always use authentication
        kwargs.setdefault('default_acl', 'private')  # Use private ACL since we use pre-signed URLs
        kwargs.setdefault('file_overwrite', False)   # Never overwrite files with same name
        kwargs.setdefault('signature_version', 's3v4')  # Use latest signature version
        
        super().__init__(*args, **kwargs)
        
        # Initialize S3 client for generating presigned URLs
        self.client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME
        )
        
        # Log initialization for debugging
        logger.info(f"CustomS3Storage initialized with bucket: {self.bucket_name}")
        
        # Check if bucket owner enforced setting is enabled
        self.bucket_owner_enforced = getattr(settings, 'AWS_BUCKET_OWNER_ENFORCED', True)
    
    def generate_presigned_url(self, name, expiration=3600, content_disposition=None, content_type=None):
        """
        Generate a presigned URL for a file
        
        Args:
            name: The name (key) of the file in S3
            expiration: URL expiration time in seconds (default: 1 hour)
            content_disposition: Optional content disposition header (inline or attachment)
            content_type: Optional content type for the response
            
        Returns:
            The presigned URL string or None if an error occurs
        """
        try:
            # Handle empty name
            if not name:
                logger.warning("Empty name provided to generate_presigned_url")
                return None
                
            # Ensure the name is properly formatted with the correct prefix
            if not name.startswith(self.location):
                name = os.path.join(self.location, name)
                
            # Strip leading slash if present as it causes issues with S3
            if name.startswith('/'):
                name = name[1:]
                
            logger.info(f"Generating presigned URL for {name} in bucket {settings.AWS_STORAGE_BUCKET_NAME}")
            
            # Build parameters with required authentication
            params = {
                'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                'Key': name
            }
            
            # Add content disposition if provided
            if content_disposition:
                params['ResponseContentDisposition'] = content_disposition
                
            # Add content type if provided, otherwise guess from extension
            if content_type:
                params['ResponseContentType'] = content_type
            else:
                # Try to guess content type from extension
                if name.lower().endswith('.pdf'):
                    params['ResponseContentType'] = 'application/pdf'
                elif name.lower().endswith('.png'):
                    params['ResponseContentType'] = 'image/png'
                elif name.lower().endswith(('.jpg', '.jpeg')):
                    params['ResponseContentType'] = 'image/jpeg'
                elif name.lower().endswith('.gif'):
                    params['ResponseContentType'] = 'image/gif'
            
            # Generate the URL with signature v4 for better security
            url = self.client.generate_presigned_url(
                'get_object',
                Params=params,
                ExpiresIn=expiration
            )
            
            logger.info(f"Successfully generated presigned URL for {name}")
            return url
            
        except ClientError as e:
            logger.error(f"AWS ClientError generating presigned URL for {name}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error generating presigned URL for {name}: {e}")
            return None
    
    def url(self, name):
        """
        Override the default URL method to use presigned URLs for all objects
        Since we're using bucket owner enforced policy, we need pre-signed URLs
        """
        logger.info(f"Generating pre-signed URL for file access: {name}")
        
        # Always use pre-signed URLs with a 24 hour expiration for better user experience
        presigned_url = self.generate_presigned_url(name, expiration=24*3600)
        
        if presigned_url:
            return presigned_url
        
        # If pre-signed URL generation fails, fall back to standard URL
        # This will likely fail to access the file due to permissions but provides a fallback
        logger.warning(f"Pre-signed URL generation failed for {name}, falling back to standard URL")
        return super().url(name)
    
    def apply_public_acl(self, name):
        """
        Make an object publicly accessible by setting its ACL to public-read
        NOTE: This will fail if the bucket has bucket owner enforced setting enabled
        
        Args:
            name: The name (key) of the file in S3
            
        Returns:
            True if successful, False otherwise
        """
        # If bucket owner enforced is enabled, don't attempt to change ACL
        if self.bucket_owner_enforced:
            logger.warning(f"Skipping ACL change for {name} due to bucket owner enforced setting")
            return False
            
        try:
            logger.info(f"Attempting to set public-read ACL for {name}")
            self.client.put_object_acl(
                Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                Key=name,
                ACL='public-read'
            )
            logger.info(f"Successfully set public-read ACL for {name}")
            return True
        except ClientError as e:
            logger.error(f"Error setting public ACL for {name}: {e}")
            return False
    
    def check_object_permissions(self, name):
        """
        Check permissions on an object to diagnose access issues
        
        Args:
            name: The name (key) of the file in S3
            
        Returns:
            Dict with permission info or None if error
        """
        try:
            # Ensure the name is properly formatted
            if not name.startswith(self.location):
                name = os.path.join(self.location, name)
                
            if name.startswith('/'):
                name = name[1:]
                
            logger.info(f"Checking permissions for {name}")
            
            # Try to head the object to check access
            response = self.client.head_object(
                Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                Key=name
            )
            
            return {
                'exists': True,
                'content_type': response.get('ContentType'),
                'content_length': response.get('ContentLength'),
                'metadata': response.get('Metadata', {}),
                'storage_class': response.get('StorageClass')
            }
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                logger.error(f"Object {name} does not exist")
                return {'exists': False, 'error': 'Not found'}
            elif e.response['Error']['Code'] == '403':
                logger.error(f"No permission to access {name}: {e}")
                return {'exists': True, 'error': 'Access denied'}
            else:
                logger.error(f"Error checking permissions for {name}: {e}")
                return {'exists': None, 'error': str(e)}
