# Cloudinary Video Upload - Frontend Usage Guide

## Overview

This guide provides examples of how to use the video upload API from the frontend using Axios.

## Prerequisites

```bash
npm install axios
```

## API Base URL

```javascript
const API_BASE_URL = 'http://localhost:3001/api';
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```javascript
const config = {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
};
```

---

## 1. Upload Video with Thumbnail

**Endpoint:** `POST /api/videos`  
**Access:** Private (Docente+)  
**Content-Type:** `multipart/form-data`

### Example

```javascript
import axios from 'axios';

const uploadVideo = async (videoFile, thumbnailFile, title, description, duration) => {
  try {
    // Create FormData
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('thumbnail', thumbnailFile);
    formData.append('title', title);
    formData.append('description', description);
    if (duration) {
      formData.append('duration', duration);
    }

    // Upload with progress tracking
    const response = await axios.post(
      `${API_BASE_URL}/videos`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload Progress: ${percentCompleted}%`);
          // Update UI with progress
        }
      }
    );

    console.log('Video uploaded successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading video:', error.response?.data || error.message);
    throw error;
  }
};
```

### React Component Example

```javascript
import React, { useState } from 'react';
import axios from 'axios';

const VideoUploadForm = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!videoFile || !thumbnailFile) {
      alert('Please select both video and thumbnail');
      return;
    }

    setUploading(true);
    
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('thumbnail', thumbnailFile);
    formData.append('title', title);
    formData.append('description', description);

    try {
      const response = await axios.post(
        'http://localhost:3001/api/videos',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress);
          }
        }
      );

      alert('Video uploaded successfully!');
      console.log(response.data);
      
      // Reset form
      setVideoFile(null);
      setThumbnailFile(null);
      setTitle('');
      setDescription('');
      setUploadProgress(0);
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Video File:</label>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setVideoFile(e.target.files[0])}
          required
        />
      </div>

      <div>
        <label>Thumbnail:</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setThumbnailFile(e.target.files[0])}
          required
        />
      </div>

      <div>
        <label>Title:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
        />
      </div>

      <div>
        <label>Description:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          maxLength={2000}
        />
      </div>

      {uploading && (
        <div>
          <progress value={uploadProgress} max="100" />
          <span>{uploadProgress}%</span>
        </div>
      )}

      <button type="submit" disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload Video'}
      </button>
    </form>
  );
};

export default VideoUploadForm;
```

---

## 2. Get All Approved Videos

**Endpoint:** `GET /api/videos`  
**Access:** Public

### Example

```javascript
const getVideos = async (page = 1, limit = 10) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/videos?page=${page}&limit=${limit}`
    );

    console.log('Videos:', response.data.data);
    console.log('Pagination:', response.data.pagination);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw error;
  }
};
```

### Response Example

```json
{
  "success": true,
  "data": [
    {
      "_id": "video_id",
      "title": "Video Title",
      "description": "Video description",
      "videoUrl": "https://res.cloudinary.com/...",
      "thumbnailUrl": "https://res.cloudinary.com/...",
      "author": {
        "_id": "user_id",
        "name": "Author Name",
        "email": "author@example.com"
      },
      "duration": 120,
      "views": 150,
      "likeCount": 25,
      "dislikeCount": 2,
      "approved": true,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

---

## 3. Get Video by ID

**Endpoint:** `GET /api/videos/:id`  
**Access:** Public

### Example

```javascript
const getVideoById = async (videoId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/videos/${videoId}`);
    
    console.log('Video:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching video:', error);
    throw error;
  }
};
```

---

## 4. Approve Video

**Endpoint:** `PUT /api/videos/:id/approve`  
**Access:** Private (Admin+)

### Example

```javascript
const approveVideo = async (videoId, accessToken) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/videos/${videoId}/approve`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    console.log('Video approved:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error approving video:', error);
    throw error;
  }
};
```

---

## 5. Update Video

**Endpoint:** `PUT /api/videos/:id`  
**Access:** Private (Author or Admin)

### Example

```javascript
const updateVideo = async (videoId, title, description, accessToken) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/videos/${videoId}`,
      { title, description },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    console.log('Video updated:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating video:', error);
    throw error;
  }
};
```

---

## 6. Delete Video

**Endpoint:** `DELETE /api/videos/:id`  
**Access:** Private (Author or Admin)

### Example

```javascript
const deleteVideo = async (videoId, accessToken) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/videos/${videoId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    console.log('Video deleted:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting video:', error);
    throw error;
  }
};
```

---

## 7. Like Video

**Endpoint:** `POST /api/videos/:id/like`  
**Access:** Private

### Example

```javascript
const likeVideo = async (videoId, accessToken) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/videos/${videoId}/like`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    console.log('Video liked:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error liking video:', error);
    throw error;
  }
};
```

---

## 8. Dislike Video

**Endpoint:** `POST /api/videos/:id/dislike`  
**Access:** Private

### Example

```javascript
const dislikeVideo = async (videoId, accessToken) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/videos/${videoId}/dislike`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    console.log('Video disliked:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error disliking video:', error);
    throw error;
  }
};
```

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

- `VIDEO_REQUIRED` - Video file not provided
- `THUMBNAIL_REQUIRED` - Thumbnail not provided
- `INVALID_VIDEO_FORMAT` - Invalid video format
- `INVALID_THUMBNAIL_FORMAT` - Invalid thumbnail format
- `VIDEO_NOT_FOUND` - Video not found
- `FORBIDDEN` - Not authorized
- `MISSING_FIELDS` - Required fields missing

---

## File Size Limits

- **Video:** Maximum 500MB
- **Thumbnail:** Maximum 5MB

## Supported Formats

### Video
- mp4, avi, mov, mkv, webm, mpeg

### Thumbnail
- jpg, jpeg, png, webp

---

## Complete API Service Example

```javascript
// src/services/videoService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const getAuthHeader = () => ({
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});

export const videoService = {
  uploadVideo: async (videoFile, thumbnailFile, data, onProgress) => {
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('thumbnail', thumbnailFile);
    formData.append('title', data.title);
    formData.append('description', data.description);
    if (data.duration) formData.append('duration', data.duration);

    return axios.post(`${API_BASE_URL}/videos`, formData, {
      ...getAuthHeader(),
      headers: {
        ...getAuthHeader().headers,
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onProgress
    });
  },

  getVideos: (page = 1, limit = 10) => {
    return axios.get(`${API_BASE_URL}/videos?page=${page}&limit=${limit}`);
  },

  getVideoById: (id) => {
    return axios.get(`${API_BASE_URL}/videos/${id}`);
  },

  approveVideo: (id) => {
    return axios.put(`${API_BASE_URL}/videos/${id}/approve`, {}, getAuthHeader());
  },

  updateVideo: (id, data) => {
    return axios.put(`${API_BASE_URL}/videos/${id}`, data, getAuthHeader());
  },

  deleteVideo: (id) => {
    return axios.delete(`${API_BASE_URL}/videos/${id}`, getAuthHeader());
  },

  likeVideo: (id) => {
    return axios.post(`${API_BASE_URL}/videos/${id}/like`, {}, getAuthHeader());
  },

  dislikeVideo: (id) => {
    return axios.post(`${API_BASE_URL}/videos/${id}/dislike`, {}, getAuthHeader());
  }
};
```

---

## Notes

1. Always handle errors appropriately in your frontend
2. Show upload progress to improve UX
3. Validate file types and sizes before uploading
4. Store access tokens securely
5. Refresh tokens when they expire
