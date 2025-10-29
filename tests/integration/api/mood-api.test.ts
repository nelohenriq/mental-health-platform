import { NextRequest } from 'next/server'
import { expect } from '@jest/globals'
import { GET, POST, PUT, DELETE } from '@/app/api/mood/entries/route'

describe('Mood API Integration Tests', () => {
  const mockUser = { id: 'test-user-id', email: 'test@example.com' }

  beforeEach(() => {
    // Mock authentication
    jest.mock('next-auth', () => ({
      getServerSession: jest.fn(() => Promise.resolve({ user: mockUser }))
    }))
  })

  describe('GET /api/mood/entries', () => {
    it('should return mood entries for authenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/mood/entries')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should return 401 for unauthenticated requests', async () => {
      // Mock unauthenticated session
      jest.mock('next-auth', () => ({
        getServerSession: jest.fn(() => Promise.resolve(null))
      }))

      const request = new NextRequest('http://localhost:3000/api/mood/entries')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/mood/entries', () => {
    it('should create a new mood entry', async () => {
      const moodData = {
        moodLevel: 7,
        notes: 'Feeling good today',
        factors: ['exercise', 'sleep']
      }

      const request = new NextRequest('http://localhost:3000/api/mood/entries', {
        method: 'POST',
        body: JSON.stringify(moodData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.moodLevel).toBe(7)
      expect(data.notes).toBe('Feeling good today')
    })

    it('should validate mood level range', async () => {
      const invalidData = { moodLevel: 15, notes: 'Invalid mood' }

      const request = new NextRequest('http://localhost:3000/api/mood/entries', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })
  })

  describe('PUT /api/mood/entries', () => {
    it('should update an existing mood entry', async () => {
      const updateData = { id: '123', moodLevel: 8, notes: 'Updated notes' }

      const request = new NextRequest('http://localhost:3000/api/mood/entries', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await PUT(request)
      expect([200, 404]).toContain(response.status) // Either updated or not found
    })
  })

  describe('DELETE /api/mood/entries', () => {
    it('should delete a mood entry', async () => {
      const request = new NextRequest('http://localhost:3000/api/mood/entries?id=123', {
        method: 'DELETE'
      })

      const response = await DELETE(request)
      expect([200, 404]).toContain(response.status) // Either deleted or not found
    })
  })
})