# MelbMinds - University of Melbourne Study Groups

A collaborative study group platform built for University of Melbourne students, by University of Melbourne students.

## Features

### File Upload System
- **Group File Sharing**: Upload and share files with group members
- **S3 Storage**: Files are stored securely in AWS S3
- **Windows 10 Desktop Style**: Files displayed with icons and metadata
- **Access Control**: Only group members and creators can access files
- **File Management**: Upload, download, and delete files (with proper permissions)

### Core Features
- Study group creation and management
- Real-time chat and messaging
- Session scheduling and management
- User authentication and profiles
- Smart group matching
- Collaborative flashcards

## File Upload Implementation

### Backend (Django)
- **Model**: `GroupFile` - stores file metadata and S3 references
- **API Endpoints**:
  - `GET /api/groups/{id}/files/` - List group files
  - `POST /api/groups/{id}/files/` - Upload file
  - `GET /api/files/{id}/download/` - Download file
  - `DELETE /api/files/{id}/delete/` - Delete file
- **Storage**: AWS S3 with django-storages
- **Permissions**: Group members and creators only

### Frontend (Next.js)
- **Upload Button**: Integrated with existing UI
- **File Display**: Windows 10 desktop style with file icons
- **File Actions**: Download and delete (with permission checks)
- **Empty State**: "No files uploaded" message when no files exist

### File Types Supported
- Documents: PDF, DOC, DOCX, TXT
- Spreadsheets: XLS, XLSX
- Presentations: PPT, PPTX
- Images: JPG, JPEG, PNG, GIF
- Videos: MP4, AVI, MOV
- Audio: MP3, WAV
- Archives: ZIP, RAR
- Default: Generic file icon for other types

## Setup

### Backend
```bash
cd server
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd client
npm install
npm run dev
```

## Environment Variables

### AWS S3 Configuration
```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_STORAGE_BUCKET_NAME=your_bucket_name
AWS_S3_REGION_NAME=ap-southeast-2
```

## Usage

1. **Join or Create a Group**: Users must be group members to access files
2. **Upload Files**: Click "Upload File" button in the Files tab
3. **View Files**: Files are displayed in a grid with icons and metadata
4. **Download Files**: Click on file or use download button
5. **Delete Files**: Only uploaders and group creators can delete files

## Security Features

- **Authentication Required**: All file operations require valid JWT tokens
- **Group Access Control**: Only group members can access group files
- **Permission-Based Deletion**: Only file uploaders and group creators can delete files
- **S3 Security**: Files stored with proper AWS security configurations