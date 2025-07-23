import os
from django.conf import settings
import boto3
from botocore.exceptions import ClientError
from storages.backends.s3boto3 import S3Boto3Storage

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
            return url
        except ClientError as e:
            print(f"Error generating presigned URL: {e}")
            return None
    
    def apply_public_acl(self, name):
        """
        Make an object publicly accessible by setting its ACL to public-read
        
        Args:
            name: The name (key) of the file in S3
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.client.put_object_acl(
                Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                Key=name,
                ACL='public-read'
            )
            return True
        except ClientError as e:
            print(f"Error setting public ACL: {e}")
            return False
