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
        super().__init__(*args, **kwargs)
        # Initialize S3 client for generating presigned URLs
        self.client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME
        )
        # Check if bucket owner enforced setting is enabled
        self.bucket_owner_enforced = getattr(settings, 'AWS_BUCKET_OWNER_ENFORCED', True)
    
    def generate_presigned_url(self, name, expiration=3600, content_disposition=None):
        """
        Generate a presigned URL for a file
        
        Args:
            name: The name (key) of the file in S3
            expiration: URL expiration time in seconds (default: 1 hour)
            content_disposition: Optional content disposition header
            
        Returns:
            The presigned URL string or None if an error occurs
        """
        try:
            # Ensure the name is properly formatted with the correct prefix
            if not name.startswith(self.location):
                name = os.path.join(self.location, name)
                
            # Strip leading slash if present as it causes issues with S3
            if name.startswith('/'):
                name = name[1:]
                
            logger.info(f"Generating presigned URL for {name} in bucket {settings.AWS_STORAGE_BUCKET_NAME}")
            
            params = {
                'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                'Key': name
            }
            
            if content_disposition:
                params['ResponseContentDisposition'] = content_disposition
                
            url = self.client.generate_presigned_url(
                'get_object',
                Params=params,
                ExpiresIn=expiration
            )
            logger.info(f"Generated presigned URL for {name}")
            return url
        except ClientError as e:
            logger.error(f"Error generating presigned URL for {name}: {e}")
            return None
    
    def url(self, name):
        """
        Override the default URL method to use presigned URLs when needed
        """
        if self.bucket_owner_enforced:
            logger.info(f"Using presigned URL for {name} due to bucket owner enforced setting")
            # Use a longer expiration for general access URLs
            return self.generate_presigned_url(name, expiration=24*3600)
        
        # Fall back to the standard URL method if bucket owner enforced is not enabled
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
