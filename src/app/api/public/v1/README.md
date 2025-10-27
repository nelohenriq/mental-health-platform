# Mental Health Platform Public API v1

This document describes the public API endpoints available for external integrations with the Mental Health Platform.

## Authentication

All API requests require an API key passed in the `X-API-Key` header:

```
X-API-Key: your-api-key-here
```

## Base URL

```
https://api.mentalhealthplatform.com/public/v1
```

## Endpoints

### Mood Tracking

#### POST /mood
Create a new mood entry for a user.

**Request Body:**
```json
{
  "userId": "user-123",
  "moodLevel": 7,
  "notes": "Feeling good today",
  "factors": ["exercise", "social"],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response:**
```json
{
  "id": "mood-456",
  "moodLevel": 7,
  "notes": "Feeling good today",
  "factors": ["exercise", "social"],
  "timestamp": "2024-01-15T10:30:00Z",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### GET /mood
Retrieve mood entries for a user.

**Query Parameters:**
- `userId` (required): User identifier
- `startDate`: Start date filter (ISO 8601)
- `endDate`: End date filter (ISO 8601)
- `limit`: Maximum number of entries (default: 50)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "entries": [
    {
      "id": "mood-456",
      "moodLevel": 7,
      "notes": "Feeling good today",
      "factors": ["exercise", "social"],
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### AI Conversations

#### POST /conversations
Create a conversation and get AI therapeutic response.

**Request Body:**
```json
{
  "userId": "user-123",
  "message": "I've been feeling anxious lately",
  "context": {
    "previousMood": 6,
    "currentSession": true
  }
}
```

**Response:**
```json
{
  "conversationId": "conv-789",
  "message": "I understand anxiety can be challenging. Can you tell me more about what's been causing these feelings?",
  "crisisDetected": false,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### GET /conversations
Retrieve conversation history for a user.

**Query Parameters:**
- `userId` (required): User identifier
- `limit`: Maximum number of conversations (default: 20)
- `offset`: Pagination offset (default: 0)

### CBT Exercises

#### GET /cbt
Retrieve available CBT exercises.

**Query Parameters:**
- `category`: Filter by category (THOUGHT_CHALLENGING, BEHAVIOR_ACTIVATION, etc.)
- `difficulty`: Filter by difficulty (BEGINNER, INTERMEDIATE, ADVANCED)
- `limit`: Maximum number of exercises (default: 20)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "exercises": [
    {
      "id": "exercise-123",
      "title": "Thought Challenging Exercise",
      "description": "Learn to challenge negative thoughts",
      "category": "THOUGHT_CHALLENGING",
      "difficulty": "BEGINNER",
      "content": { "instructions": "...", "fields": [...] },
      "mediaUrls": ["https://example.com/audio.mp3"],
      "version": 1,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### POST /cbt
Submit CBT session progress.

**Request Body:**
```json
{
  "userId": "user-123",
  "exerciseId": "exercise-123",
  "progress": {
    "step1": "completed",
    "step2": "in_progress",
    "responses": { "question1": "answer1" }
  },
  "completed": false,
  "score": 85
}
```

### Analytics

#### GET /analytics
Retrieve user analytics and insights.

**Query Parameters:**
- `userId` (required): User identifier
- `metrics`: Comma-separated list of metrics (mood_trends, cbt_progress, engagement, wellness_correlation)
- `startDate`: Start date for analysis (ISO 8601)
- `endDate`: End date for analysis (ISO 8601)

**Response:**
```json
{
  "userId": "user-123",
  "period": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z"
  },
  "analytics": {
    "moodTrends": {
      "averageMood": 7.2,
      "trend": "improving",
      "totalEntries": 28
    },
    "cbtProgress": {
      "totalSessions": 12,
      "completedSessions": 10,
      "completionRate": 83,
      "averageScore": 82
    },
    "engagement": {
      "moodEntriesPerDay": 0.9,
      "cbtSessionsPerDay": 0.4,
      "messagesPerDay": 2.1,
      "engagementScore": 18
    }
  },
  "generatedAt": "2024-01-31T12:00:00Z"
}
```

### Webhooks

#### POST /webhooks
Register a webhook endpoint for real-time notifications.

**Request Body:**
```json
{
  "url": "https://your-app.com/webhooks/mental-health",
  "events": ["mood_entry", "cbt_session", "crisis_detected"],
  "secret": "your-webhook-secret-here"
}
```

**Response:**
```json
{
  "webhookId": "webhook-456",
  "url": "https://your-app.com/webhooks/mental-health",
  "events": ["mood_entry", "cbt_session", "crisis_detected"],
  "status": "active",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Data Export

#### POST /export
Export user data in various formats.

**Request Body:**
```json
{
  "userId": "user-123",
  "dataTypes": ["mood_entries", "cbt_sessions", "conversations", "analytics"],
  "format": "json",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z"
}
```

**Response:** File download with requested data in specified format.

## Webhook Events

### mood_entry
Triggered when a user creates a mood entry.

```json
{
  "event": "mood_entry",
  "userId": "user-123",
  "data": {
    "type": "created",
    "moodEntry": {
      "id": "mood-456",
      "moodLevel": 7,
      "notes": "Feeling good today",
      "factors": ["exercise", "social"],
      "timestamp": "2024-01-15T10:30:00Z"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### cbt_session
Triggered when a user completes a CBT session.

```json
{
  "event": "cbt_session",
  "userId": "user-123",
  "data": {
    "type": "completed",
    "session": {
      "id": "session-789",
      "exerciseId": "exercise-123",
      "progress": { "completed": true },
      "score": 90,
      "completedAt": "2024-01-15T11:00:00Z"
    }
  },
  "timestamp": "2024-01-15T11:00:00Z"
}
```

### crisis_detected
Triggered when crisis indicators are detected in user interactions.

```json
{
  "event": "crisis_detected",
  "userId": "user-123",
  "data": {
    "type": "detected",
    "crisisEvent": {
      "id": "crisis-101",
      "source": "CONVERSATION",
      "flagLevel": "HIGH",
      "detectedAt": "2024-01-15T11:15:00Z"
    }
  },
  "timestamp": "2024-01-15T11:15:00Z"
}
```

### wearable_sync
Triggered when wearable device data is synchronized.

```json
{
  "event": "wearable_sync",
  "userId": "user-123",
  "data": {
    "type": "synced",
    "wearableData": {
      "provider": "fitbit",
      "insights": {
        "activityScore": 75,
        "sleepQualityScore": 80,
        "stressIndicators": { "hrvScore": 70 }
      },
      "syncedAt": "2024-01-15T12:00:00Z"
    }
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (invalid API key)
- `404`: Not Found
- `500`: Internal Server Error

Error responses include a JSON object with an `error` field and optional `details`:

```json
{
  "error": "Invalid input",
  "details": [
    {
      "field": "moodLevel",
      "message": "Must be between 1 and 10"
    }
  ]
}
```

## Rate Limiting

API requests are rate limited. Current limits:
- 1000 requests per hour per API key
- 100 requests per minute per API key

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests per time window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets (Unix timestamp)

## Data Privacy

- All data transmission is encrypted using TLS 1.3
- User data is processed in compliance with HIPAA and GDPR
- API keys should be stored securely and rotated regularly
- Webhook endpoints should verify request signatures for security

## Support

For API support or questions:
- Email: api-support@mentalhealthplatform.com
- Documentation: https://docs.mentalhealthplatform.com/api/v1
- Status Page: https://status.mentalhealthplatform.com