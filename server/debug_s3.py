import os
import boto3
from django.conf import settings
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "server.settings")
django.setup()

def check_s3_configuration():
    """Check the S3 bucket configuration"""
    try:
        from django.conf import settings
        
        # Print settings
        print("\n===== S3 Settings =====")
        print(f"AWS_ACCESS_KEY_ID: {'*' * 4}{settings.AWS_ACCESS_KEY_ID[-4:] if settings.AWS_ACCESS_KEY_ID else 'Not set'}")
        print(f"AWS_SECRET_ACCESS_KEY: {'*' * 8}{'present' if settings.AWS_SECRET_ACCESS_KEY else 'Not set'}")
        print(f"AWS_STORAGE_BUCKET_NAME: {settings.AWS_STORAGE_BUCKET_NAME}")
        print(f"AWS_S3_REGION_NAME: {settings.AWS_S3_REGION_NAME}")
        print(f"AWS_S3_CUSTOM_DOMAIN: {settings.AWS_S3_CUSTOM_DOMAIN}")
        print(f"AWS_DEFAULT_ACL: {settings.AWS_DEFAULT_ACL}")
        
        # Initialize S3 client
        s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME
        )
        
        # Check if bucket exists
        try:
            s3_client.head_bucket(Bucket=settings.AWS_STORAGE_BUCKET_NAME)
            print(f"\n✅ Bucket {settings.AWS_STORAGE_BUCKET_NAME} exists and is accessible")
        except Exception as e:
            print(f"\n❌ Error accessing bucket: {e}")
            return
        
        # Check bucket CORS configuration
        try:
            cors = s3_client.get_bucket_cors(Bucket=settings.AWS_STORAGE_BUCKET_NAME)
            print("\n===== CORS Configuration =====")
            print(cors)
        except Exception as e:
            print(f"\n❌ Error retrieving CORS configuration: {e}")
            print("\nThe bucket may not have CORS configured.")
            print("Suggested CORS Configuration:")
            print("""
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["*"],  # Restrict to your domain in production
        "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
        "MaxAgeSeconds": 3000
    }
]
            """)
            
        # Check bucket ACL
        try:
            acl = s3_client.get_bucket_acl(Bucket=settings.AWS_STORAGE_BUCKET_NAME)
            print("\n===== Bucket ACL =====")
            print("Owner:", acl["Owner"])
            print("Grants:")
            for grant in acl["Grants"]:
                grantee = grant["Grantee"]
                permission = grant["Permission"]
                if "DisplayName" in grantee:
                    print(f"  - {grantee.get('DisplayName', 'Unknown')} ({grantee.get('ID', 'Unknown ID')}): {permission}")
                elif "URI" in grantee:
                    print(f"  - {grantee.get('URI', 'Unknown URI')}: {permission}")
        except Exception as e:
            print(f"\n❌ Error retrieving bucket ACL: {e}")
            
        # Check bucket policy
        try:
            policy = s3_client.get_bucket_policy(Bucket=settings.AWS_STORAGE_BUCKET_NAME)
            print("\n===== Bucket Policy =====")
            print(policy.get("Policy", "No policy found"))
        except Exception as e:
            print(f"\n❌ No bucket policy or error retrieving it: {e}")
            print("Suggested Bucket Policy for public read:")
            print('''
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
            ''')
            
        # Check public access block settings
        try:
            public_access_block = s3_client.get_public_access_block(Bucket=settings.AWS_STORAGE_BUCKET_NAME)
            print("\n===== Public Access Block =====")
            print(public_access_block["PublicAccessBlockConfiguration"])
        except Exception as e:
            print(f"\n❌ Error retrieving public access block settings: {e}")
            
        # List files in the bucket (up to 10)
        try:
            objects = s3_client.list_objects_v2(Bucket=settings.AWS_STORAGE_BUCKET_NAME, MaxKeys=10)
            print(f"\n===== Files in Bucket ({min(10, objects.get('KeyCount', 0))} of {objects.get('KeyCount', 0)}) =====")
            
            for obj in objects.get('Contents', []):
                print(f"Key: {obj['Key']}, Size: {obj['Size']} bytes, Last Modified: {obj['LastModified']}")
                
                # Check ACL for the object
                try:
                    obj_acl = s3_client.get_object_acl(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=obj['Key'])
                    print(f"  Object ACL:")
                    for grant in obj_acl["Grants"]:
                        grantee = grant["Grantee"]
                        permission = grant["Permission"]
                        if "DisplayName" in grantee:
                            print(f"    - {grantee.get('DisplayName', 'Unknown')} ({grantee.get('ID', 'Unknown ID')}): {permission}")
                        elif "URI" in grantee:
                            print(f"    - {grantee.get('URI', 'Unknown URI')}: {permission}")
                except Exception as e:
                    print(f"  ❌ Error retrieving object ACL: {e}")
                
                # Generate a presigned URL (valid for 1 hour)
                try:
                    presigned_url = s3_client.generate_presigned_url(
                        'get_object',
                        Params={'Bucket': settings.AWS_STORAGE_BUCKET_NAME, 'Key': obj['Key']},
                        ExpiresIn=3600
                    )
                    print(f"  Presigned URL (valid for 1 hour): {presigned_url}")
                except Exception as e:
                    print(f"  ❌ Error generating presigned URL: {e}")
                    
                # Try to make the object public
                try:
                    s3_client.put_object_acl(
                        Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                        Key=obj['Key'],
                        ACL='public-read'
                    )
                    print(f"  ✅ Made object public-read: s3://{settings.AWS_STORAGE_BUCKET_NAME}/{obj['Key']}")
                except Exception as e:
                    print(f"  ❌ Error making object public: {e}")
                    
                # Check if the object is accessible via public URL
                public_url = f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com/{obj['Key']}"
                print(f"  Public URL: {public_url}")
                print("  You should test this URL in your browser to verify if it's accessible")
                
                print("\n" + "-" * 60)
        except Exception as e:
            print(f"\n❌ Error listing objects: {e}")
            
        print("\nRecommended Actions:")
        print("1. Ensure your S3 bucket has CORS configured")
        print("2. If you need public access, set bucket policy for public read")
        print("3. Make sure object ACLs are set to 'public-read' or use presigned URLs")
        print("4. If using presigned URLs, update your code to get and use them")
        
    except ImportError:
        print("Django settings module not found. Make sure to run this script from the correct directory.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_s3_configuration()
