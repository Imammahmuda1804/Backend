# 📚 Complete API Documentation - Wisata Backend

**Base URL**: `http://localhost:3000`  
**API Version**: 1.0.0  
**Last Updated**: May 8, 2026

---

## 📋 Table of Contents

1. [Authentication](#1-authentication)
2. [Users](#2-users)
3. [Public Destinations](#3-public-destinations)
4. [Search](#4-search)
5. [Favorites](#5-favorites)
6. [User Reviews](#6-user-reviews)
7. [Topics](#7-topics)
8. [Analytics Public](#8-analytics-public)
9. [Admin - Users](#9-admin---users)
10. [Admin - Destinations](#10-admin---destinations)
11. [Admin - Scraper](#11-admin---scraper)
12. [Admin - Uploads](#12-admin---uploads)
13. [Admin - Analytics](#13-admin---analytics)
14. [Admin - Moderation](#14-admin---moderation)

---

## 🔐 Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <access_token>
```

---

## 1. Authentication

### 1.1 Register User

**Endpoint**: `POST /api/auth/register`  
**Access**: Public  
**Description**: Register new user account

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@mail.com",
  "password": "password123",
  "profilePicture": "/uploads/profiles/john.jpg"
}
```

**Field Validation**:
- `name`: Required, min 2 characters
- `email`: Required, valid email format, unique
- `password`: Required, min 6 characters
- `profilePicture`: Optional, string (URL)

**Success Response** (201 Created):
```json
{
  "status": "success",
  "data": {
    "id": 3,
    "name": "John Doe",
    "email": "john@mail.com",
    "role": "USER",
    "profilePicture": "/uploads/profiles/john.jpg",
    "createdAt": "2026-05-08T12:00:00.000Z"
  }
}
```

**Error Responses**:

400 Bad Request - Validation Error:
```json
{
  "statusCode": 400,
  "message": [
    "Nama minimal 2 karakter",
    "Format email tidak valid",
    "Password minimal 6 karakter"
  ],
  "error": "Bad Request"
}
```

409 Conflict - Email Already Exists:
```json
{
  "statusCode": 409,
  "message": "Email sudah terdaftar",
  "error": "Conflict"
}
```

---

### 1.2 Login

**Endpoint**: `POST /api/auth/login`  
**Access**: Public  
**Description**: Login and get access token

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "john@mail.com",
  "password": "password123"
}
```

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 3,
      "name": "John Doe",
      "email": "john@mail.com",
      "role": "USER"
    }
  }
}
```

**Error Responses**:

401 Unauthorized - Invalid Credentials:
```json
{
  "statusCode": 401,
  "message": "Email atau password salah",
  "error": "Unauthorized"
}
```

401 Unauthorized - Account Suspended:
```json
{
  "statusCode": 401,
  "message": "Akun Anda telah dinonaktifkan",
  "error": "Unauthorized"
}
```

---

### 1.3 Refresh Token

**Endpoint**: `POST /api/auth/refresh`  
**Access**: Public  
**Description**: Get new access token using refresh token

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response**:

401 Unauthorized:
```json
{
  "statusCode": 401,
  "message": "Refresh token tidak valid atau sudah expired",
  "error": "Unauthorized"
}
```

---

### 1.4 Logout

**Endpoint**: `POST /api/auth/logout`  
**Access**: Public  
**Description**: Logout user (invalidate refresh token)

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## 2. Users

### 2.1 Get Current User Profile

**Endpoint**: `GET /api/users/profile`  
**Access**: Protected (USER, ADMIN)  
**Description**: Get current logged-in user profile

**Headers**:
```
Authorization: Bearer <access_token>
```

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "id": 3,
    "name": "John Doe",
    "email": "john@mail.com",
    "role": "USER",
    "status": "active",
    "profilePicture": "/uploads/profiles/john.jpg",
    "createdAt": "2026-05-08T12:00:00.000Z"
  }
}
```

**Error Response**:

401 Unauthorized:
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

---

### 2.2 Update Profile

**Endpoint**: `PUT /api/users/profile`  
**Access**: Protected (USER, ADMIN)  
**Description**: Update current user profile

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body** (all fields optional):
```json
{
  "name": "John Updated",
  "email": "newemail@mail.com",
  "password": "newpassword123",
  "profilePicture": "/uploads/profiles/new-photo.jpg"
}
```

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "id": 3,
    "name": "John Updated",
    "email": "newemail@mail.com",
    "role": "USER",
    "profilePicture": "/uploads/profiles/new-photo.jpg",
    "createdAt": "2026-05-08T12:00:00.000Z"
  }
}
```

**Error Responses**:

409 Conflict - Email Already Used:
```json
{
  "statusCode": 409,
  "message": "Email sudah digunakan oleh pengguna lain",
  "error": "Conflict"
}
```

---

## 3. Public Destinations

### 3.1 Get Recommendations

**Endpoint**: `GET /api/destinations/recommendations`  
**Access**: Public  
**Description**: Get recommended destinations sorted by recommendation score

**Headers**: None required

**Query Parameters**:
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 10, max 100

**Example Request**:
```
GET /api/destinations/recommendations?page=1&limit=10
```

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "Jam Gadang",
      "slug": "jam-gadang",
      "city": "Bukittinggi",
      "province": "Sumatera Barat",
      "thumbnailUrl": "https://example.com/jam-gadang.jpg",
      "googleRating": 4.5,
      "userRating": 4.7,
      "positiveRatio": 0.85,
      "recommendationScore": 0.78
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "total_pages": 5
  }
}
```

---

### 3.2 Get Destinations (List with Filters)

**Endpoint**: `GET /api/destinations`  
**Access**: Public  
**Description**: Get all destinations with pagination and optional filters by search query or topic ID

**Headers**: None required

**Query Parameters**:
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 10, max 100
- `search` (optional): Search by destination name or city
- `topic_id` (optional): Filter by Topic ID

**Example Request**:
```
GET /api/destinations?page=1&limit=10&topic_id=5&search=bukit
```

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "Jam Gadang",
      "slug": "jam-gadang",
      "city": "Bukittinggi",
      "province": "Sumatera Barat",
      "thumbnailUrl": "https://example.com/jam-gadang.jpg",
      "googleRating": 4.5,
      "userRating": 4.7,
      "positiveRatio": 0.85,
      "recommendationScore": 0.78
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "total_pages": 1
  }
}
```

---

**Endpoint**: `GET /api/destinations/ranking`  
**Access**: Public  
**Description**: Get top destinations ranking

**Headers**: None required

**Query Parameters**:
- `sort_by` (optional): Sort criteria - `recommendation` (default), `sentiment`, `rating`
- `limit` (optional): Number of results, default 10

**Example Request**:
```
GET /api/destinations/ranking?sort_by=sentiment&limit=5
```

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "Jam Gadang",
      "slug": "jam-gadang",
      "city": "Bukittinggi",
      "province": "Sumatera Barat",
      "thumbnailUrl": "https://example.com/jam-gadang.jpg",
      "googleRating": 4.5,
      "userRating": 4.7,
      "positiveRatio": 0.85,
      "recommendationScore": 0.78
    }
  ]
}
```

---

### 3.4 Get Destination Detail

**Endpoint**: `GET /api/destinations/:id`  
**Access**: Public  
**Description**: Get detailed information about a destination including user reviews

**Headers**: None required

**Path Parameters**:
- `id`: Destination ID (integer)

**Example Request**:
```
GET /api/destinations/1
```

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Jam Gadang",
    "slug": "jam-gadang",
    "description": "Ikon wisata Bukittinggi...",
    "city": "Bukittinggi",
    "province": "Sumatera Barat",
    "latitude": -0.305,
    "longitude": 100.369,
    "googleMapsUrl": "https://maps.app.goo.gl/...",
    "googlePlaceId": "ChIJ...",
    "googleRating": 4.5,
    "googleReviewCount": 1250,
    "userRating": 4.7,
    "userReviewCount": 45,
    "youtubeUrl": "https://youtube.com/...",
    "thumbnailUrl": "https://example.com/jam-gadang.jpg",
    "positiveRatio": 0.85,
    "recommendationScore": 0.78,
    "createdAt": "2026-05-08T10:00:00.000Z",
    "updatedAt": "2026-05-08T12:00:00.000Z",
    "images": [
      {
        "id": 1,
        "imageUrl": "/uploads/destinations/img1.jpg",
        "createdAt": "2026-05-08T10:00:00.000Z"
      }
    ],
    "sentimentTrends": [
      {
        "id": 1,
        "date": "2024-03-01T00:00:00.000Z",
        "positiveCount": 24,
        "negativeCount": 0,
        "neutralCount": 54
      }
    ],
    "destinationTopics": [
      {
        "id": 1,
        "topicId": 23,
        "totalReviews": 15,
        "topic": {
          "id": 23,
          "topicName": "Topic 23: indah, beautiful, place",
          "keywords": ["indah", "beautiful", "place", "terindah", "desa"]
        }
      }
    ],
    "userReviews": [
      {
        "id": 1,
        "userId": 3,
        "rating": 5,
        "reviewText": "Tempat yang sangat indah! Recommended banget.",
        "createdAt": "2026-05-08T10:00:00.000Z",
        "user": {
          "id": 3,
          "name": "John Doe",
          "profilePicture": "/uploads/profiles/john.jpg"
        }
      }
    ],
    "averageUserRating": 4.7,
    "totalUserReviews": 45
  }
}
```

**Error Response**:

404 Not Found:
```json
{
  "statusCode": 404,
  "message": "Destinasi tidak ditemukan",
  "error": "Not Found"
}
```

---

## 4. Search

### 4.1 Semantic Search

**Endpoint**: `POST /api/search`  
**Access**: Public (history saved if authenticated)  
**Description**: Search destinations using natural language query with semantic search

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <access_token>  (optional - for saving history)
```

**Request Body**:
```json
{
  "query": "wisata keluarga murah di bukittinggi",
  "limit": 10
}
```

**Field Validation**:
- `query`: Required, min 3 characters
- `limit`: Optional, default 10, max 50

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "Jam Gadang",
      "slug": "jam-gadang",
      "description": "Ikon wisata Bukittinggi...",
      "city": "Bukittinggi",
      "province": "Sumatera Barat",
      "thumbnailUrl": "https://example.com/jam-gadang.jpg",
      "similarity": 0.87,
      "positiveRatio": 0.85,
      "recommendationScore": 0.78
    }
  ]
}
```

**Error Responses**:

400 Bad Request:
```json
{
  "statusCode": 400,
  "message": ["Query minimal 3 karakter"],
  "error": "Bad Request"
}
```

503 Service Unavailable - NLP Service Down:
```json
{
  "statusCode": 503,
  "message": "NLP service sedang tidak tersedia, coba beberapa saat lagi",
  "error": "Service Unavailable"
}
```

---

### 4.2 Get Search History

**Endpoint**: `GET /api/search/history`  
**Access**: Protected (USER, ADMIN)  
**Description**: Get user's search history

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 20, max 100

**Example Request**:
```
GET /api/search/history?page=1&limit=20
```

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "keyword": "wisata keluarga murah di bukittinggi",
      "createdAt": "2026-05-08T12:00:00.000Z"
    },
    {
      "id": 2,
      "keyword": "pantai indah di padang",
      "createdAt": "2026-05-08T11:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

---

### 4.3 Clear All Search History

**Endpoint**: `DELETE /api/search/history`  
**Access**: Protected (USER, ADMIN)  
**Description**: Delete all search history for current user

**Headers**:
```
Authorization: Bearer <access_token>
```

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "message": "Search history cleared",
    "deleted_count": 45
  }
}
```

---

### 4.4 Delete Specific Search History

**Endpoint**: `DELETE /api/search/history/:id`  
**Access**: Protected (USER, ADMIN)  
**Description**: Delete one search history entry

**Headers**:
```
Authorization: Bearer <access_token>
```

**Path Parameters**:
- `id`: Search log ID (integer)

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "message": "Search history entry deleted"
  }
}
```

**Error Responses**:

404 Not Found:
```json
{
  "statusCode": 404,
  "message": "Riwayat pencarian tidak ditemukan",
  "error": "Not Found"
}
```

403 Forbidden:
```json
{
  "statusCode": 403,
  "message": "Anda tidak memiliki akses ke riwayat pencarian ini",
  "error": "Forbidden"
}
```

---

## 5. Favorites

### 5.1 Add to Favorites

**Endpoint**: `POST /api/favorites/:destinationId`  
**Access**: Protected (USER, ADMIN)  
**Description**: Add destination to user's favorites

**Headers**:
```
Authorization: Bearer <access_token>
```

**Path Parameters**:
- `destinationId`: Destination ID (integer)

**Success Response** (201 Created):
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "userId": 3,
    "destinationId": 1,
    "createdAt": "2026-05-08T12:00:00.000Z"
  }
}
```

**Error Responses**:

404 Not Found:
```json
{
  "statusCode": 404,
  "message": "Destinasi tidak ditemukan",
  "error": "Not Found"
}
```

409 Conflict - Already in Favorites:
```json
{
  "statusCode": 409,
  "message": "Destinasi sudah ada di favorites",
  "error": "Conflict"
}
```

---

### 5.2 Get Favorites

**Endpoint**: `GET /api/favorites`  
**Access**: Protected (USER, ADMIN)  
**Description**: Get user's favorite destinations

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 10

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "createdAt": "2026-05-08T12:00:00.000Z",
      "destination": {
        "id": 1,
        "name": "Jam Gadang",
        "slug": "jam-gadang",
        "city": "Bukittinggi",
        "province": "Sumatera Barat",
        "thumbnailUrl": "https://example.com/jam-gadang.jpg",
        "googleRating": 4.5,
        "positiveRatio": 0.85
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "total_pages": 1
  }
}
```

---

### 5.3 Remove from Favorites

**Endpoint**: `DELETE /api/favorites/:destinationId`  
**Access**: Protected (USER, ADMIN)  
**Description**: Remove destination from favorites

**Headers**:
```
Authorization: Bearer <access_token>
```

**Path Parameters**:
- `destinationId`: Destination ID (integer)

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "message": "Removed from favorites"
  }
}
```

**Error Response**:

404 Not Found:
```json
{
  "statusCode": 404,
  "message": "Favorite tidak ditemukan",
  "error": "Not Found"
}
```

---

## 6. User Reviews

### 6.1 Create Review

**Endpoint**: `POST /api/user-reviews`  
**Access**: Protected (USER, ADMIN)  
**Description**: Create review and rating for a destination

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "destinationId": 1,
  "rating": 5,
  "reviewText": "Tempat yang sangat indah! Recommended banget untuk liburan keluarga."
}
```

**Field Validation**:
- `destinationId`: Required, integer
- `rating`: Required, integer 1-5
- `reviewText`: Optional, string

**Success Response** (201 Created):
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "userId": 3,
    "destinationId": 1,
    "rating": 5,
    "reviewText": "Tempat yang sangat indah! Recommended banget untuk liburan keluarga.",
    "createdAt": "2026-05-08T12:00:00.000Z"
  }
}
```

**Error Responses**:

404 Not Found:
```json
{
  "statusCode": 404,
  "message": "Destinasi tidak ditemukan",
  "error": "Not Found"
}
```

409 Conflict - Already Reviewed:
```json
{
  "statusCode": 409,
  "message": "Anda sudah memberikan review untuk destinasi ini",
  "error": "Conflict"
}
```

---

## 7. Topics

### 7.1 List All Topics

**Endpoint**: `GET /api/topics`  
**Access**: Public  
**Description**: Get all topics from NLP analysis

**Headers**: None required

**Query Parameters**:
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 20

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "id": 23,
      "topicName": "Topic 23: indah, beautiful, place",
      "keywords": ["indah", "beautiful", "place", "terindah", "desa"],
      "createdAt": "2026-05-08T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "total_pages": 3
  }
}
```

---

### 7.2 Get Destinations by Topic

**Endpoint**: `GET /api/topics/:id/destinations`  
**Access**: Public  
**Description**: Get destinations associated with a specific topic

**Headers**: None required

**Path Parameters**:
- `id`: Topic ID (integer)

**Query Parameters**:
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 10

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "destinationId": 1,
      "topicId": 23,
      "totalReviews": 15,
      "destination": {
        "id": 1,
        "name": "Jam Gadang",
        "slug": "jam-gadang",
        "city": "Bukittinggi",
        "province": "Sumatera Barat",
        "thumbnailUrl": "https://example.com/jam-gadang.jpg"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "total_pages": 1
  }
}
```

---

## 8. Analytics Public

### 8.1 Dashboard Summary

**Endpoint**: `GET /api/analytics/dashboard`  
**Access**: Public  
**Description**: Get public analytics dashboard summary

**Headers**: None required

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "totalDestinations": 50,
    "totalReviews": 15000,
    "averageRating": 4.3,
    "topDestinations": [
      {
        "id": 1,
        "name": "Jam Gadang",
        "recommendationScore": 0.85
      }
    ]
  }
}
```

---

### 8.2 Destination Analytics

**Endpoint**: `GET /api/analytics/destinations/:id`  
**Access**: Public  
**Description**: Get analytics for specific destination

**Headers**: None required

**Path Parameters**:
- `id`: Destination ID (integer)

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "destinationId": 1,
    "totalReviews": 150,
    "averageRating": 4.5,
    "positiveRatio": 0.85,
    "recommendationScore": 0.78,
    "sentimentDistribution": {
      "positive": 127,
      "negative": 5,
      "neutral": 18
    },
    "topTopics": [
      {
        "topicId": 23,
        "topicName": "Topic 23: indah, beautiful, place",
        "reviewCount": 45
      }
    ]
  }
}
```

---

### 8.3 Topic Distribution

**Endpoint**: `GET /api/analytics/destinations/:id/topics`  
**Access**: Public  
**Description**: Get topic distribution for destination

**Headers**: None required

**Path Parameters**:
- `id`: Destination ID (integer)

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "topicId": 23,
      "topicName": "Topic 23: indah, beautiful, place",
      "keywords": ["indah", "beautiful", "place"],
      "reviewCount": 45,
      "percentage": 30.0
    }
  ]
}
```

---

### 8.4 Sentiment Trends

**Endpoint**: `GET /api/analytics/trends/:id`  
**Access**: Public  
**Description**: Get sentiment trends over time

**Headers**: None required

**Path Parameters**:
- `id`: Destination ID (integer)

**Query Parameters**:
- `months` (optional): Number of months, default 6

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "date": "2024-03-01",
      "positiveCount": 24,
      "negativeCount": 0,
      "neutralCount": 54,
      "total": 78
    }
  ]
}
```

---

### 8.5 Compare Destinations

**Endpoint**: `GET /api/analytics/compare`  
**Access**: Public  
**Description**: Compare two destinations

**Headers**: None required

**Query Parameters**:
- `destination1`: First destination ID (required)
- `destination2`: Second destination ID (required)

**Example Request**:
```
GET /api/analytics/compare?destination1=1&destination2=2
```

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "destination1": {
      "id": 1,
      "name": "Jam Gadang",
      "totalReviews": 150,
      "averageRating": 4.5,
      "positiveRatio": 0.85,
      "recommendationScore": 0.78
    },
    "destination2": {
      "id": 2,
      "name": "Ngarai Sianok",
      "totalReviews": 120,
      "averageRating": 4.3,
      "positiveRatio": 0.80,
      "recommendationScore": 0.72
    }
  }
}
```

---

## 9. Admin - Destinations

### 9.1 List Destinations (Admin)

**Endpoint**: `GET /api/admin/destinations`  
**Access**: Protected (ADMIN)  
**Description**: Get all destinations with advanced filters for admin dashboard

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 10
- `search` (optional): Search by name or city
- `topic_id` (optional): Filter by Topic ID

**Example Request**:
```
GET /api/admin/destinations?topic_id=5&search=jam
```

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "total_pages": 1
  }
}
```

### 9.2 Create Destination

**Endpoint**: `POST /api/admin/destinations`  
**Access**: Protected (ADMIN)  
**Description**: Create a new tourist destination

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Jam Gadang",
  "description": "Ikon wisata Bukittinggi",
  "city": "Bukittinggi",
  "province": "Sumatera Barat",
  "latitude": -0.305,
  "longitude": 100.369,
  "googleMapsUrl": "https://maps.google.com/...",
  "thumbnailUrl": "https://..."
}
```

---

---

