import { Redis } from 'redis'

// Redis client configuration
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

// Create Redis client
export const redis = new Redis(redisUrl, {
  // Connection options
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      console.error('Redis connection refused')
      return new Error('Redis connection refused')
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      console.error('Redis retry time exhausted')
      return new Error('Retry time exhausted')
    }
    if (options.attempt > 10) {
      console.error('Redis max attempts reached')
      return new Error('Max attempts reached')
    }
    // Reconnect after
    return Math.min(options.attempt * 100, 3000)
  },
  // Enable offline queue
  enable_offline_queue: true,
  // Max retries per request
  maxRetriesPerRequest: 3,
  // Lazy connect (connect when first command is executed)
  lazyConnect: true,
})

// Redis event handlers
redis.on('connect', () => {
  console.log('✅ Redis connected successfully')
})

redis.on('error', (error) => {
  console.error('❌ Redis connection error:', error)
})

redis.on('ready', () => {
  console.log('🚀 Redis client ready')
})

redis.on('end', () => {
  console.log('🔌 Redis connection ended')
})

// Helper functions for common Redis operations
export class RedisCache {
  private prefix: string

  constructor(prefix = 'mental_health:') {
    this.prefix = prefix
  }

  // Generic cache operations
  async get(key: string): Promise<string | null> {
    try {
      const result = await redis.get(this.prefix + key)
      return result
    } catch (error) {
      console.error('Redis GET error:', error)
      return null
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      if (ttl) {
        await redis.setex(this.prefix + key, ttl, value)
      } else {
        await redis.set(this.prefix + key, value)
      }
      return true
    } catch (error) {
      console.error('Redis SET error:', error)
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await redis.del(this.prefix + key)
      return true
    } catch (error) {
      console.error('Redis DEL error:', error)
      return false
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(this.prefix + key)
      return result === 1
    } catch (error) {
      console.error('Redis EXISTS error:', error)
      return false
    }
  }

  // User session management
  async setUserSession(userId: string, sessionData: any, ttl = 3600): Promise<boolean> {
    return this.set(`session:${userId}`, JSON.stringify(sessionData), ttl)
  }

  async getUserSession(userId: string): Promise<any | null> {
    const data = await this.get(`session:${userId}`)
    return data ? JSON.parse(data) : null
  }

  async deleteUserSession(userId: string): Promise<boolean> {
    return this.del(`session:${userId}`)
  }

  // Mood analytics caching
  async setMoodAnalytics(userId: string, period: string, data: any, ttl = 1800): Promise<boolean> {
    return this.set(`analytics:${userId}:${period}`, JSON.stringify(data), ttl)
  }

  async getMoodAnalytics(userId: string, period: string): Promise<any | null> {
    const data = await this.get(`analytics:${userId}:${period}`)
    return data ? JSON.parse(data) : null
  }

  // API response caching
  async setApiResponse(endpoint: string, params: any, data: any, ttl = 300): Promise<boolean> {
    const key = `api:${endpoint}:${JSON.stringify(params)}`
    return this.set(key, JSON.stringify(data), ttl)
  }

  async getApiResponse(endpoint: string, params: any): Promise<any | null> {
    const key = `api:${endpoint}:${JSON.stringify(params)}`
    const data = await this.get(key)
    return data ? JSON.parse(data) : null
  }

  // Rate limiting
  async incrementRateLimit(identifier: string, window = 60): Promise<number> {
    const key = `ratelimit:${identifier}`
    const count = await redis.incr(key)

    if (count === 1) {
      await redis.expire(key, window)
    }

    return count
  }

  async getRateLimit(identifier: string): Promise<number> {
    const key = `ratelimit:${identifier}`
    const count = await redis.get(key)
    return count ? parseInt(count) : 0
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      const result = await redis.ping()
      return result === 'PONG'
    } catch (error) {
      console.error('Redis ping error:', error)
      return false
    }
  }

  // Cleanup (for testing)
  async flushAll(): Promise<boolean> {
    try {
      await redis.flushall()
      return true
    } catch (error) {
      console.error('Redis FLUSHALL error:', error)
      return false
    }
  }
}

// Export default cache instance
export const cache = new RedisCache()

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Closing Redis connection...')
  await redis.quit()
})

process.on('SIGINT', async () => {
  console.log('🛑 Closing Redis connection...')
  await redis.quit()
})