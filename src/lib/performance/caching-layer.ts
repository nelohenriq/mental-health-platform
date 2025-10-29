import redis from 'redis';

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize?: number; // Maximum cache size
  strategy: 'LRU' | 'LFU' | 'TTL'; // Cache eviction strategy
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  hits: number;
  ttl: number;
}

export class CachingLayer {
  private redis: redis.RedisClientType;
  private localCache = new Map<string, CacheEntry>();
  private readonly MAX_LOCAL_CACHE_SIZE = 10000;

  constructor() {
    this.redis = redis.createClient();
  }

  /**
   * Get data from cache with fallback to compute function
   */
  async get<T>(
    key: string,
    computeFn: () => Promise<T>,
    config: CacheConfig = { ttl: 300, strategy: 'TTL' }
  ): Promise<T> {
    // Try local cache first
    const localEntry = this.localCache.get(key);
    if (localEntry && this.isValid(localEntry)) {
      localEntry.hits++;
      return localEntry.data;
    }

    // Try Redis cache
    try {
      const redisData = await this.redis.get(key);
      if (redisData) {
        const entry: CacheEntry<T> = JSON.parse(redisData);
        if (this.isValid(entry)) {
          // Update local cache
          this.localCache.set(key, entry);
          entry.hits++;
          return entry.data;
        }
      }
    } catch (error) {
      console.warn('Redis cache error:', error);
    }

    // Compute new value
    const data = await computeFn();

    // Cache the result
    await this.set(key, data, config);

    return data;
  }

  /**
   * Set data in cache
   */
  async set<T>(key: string, data: T, config: CacheConfig): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      hits: 1,
      ttl: config.ttl,
    };

    // Set in local cache
    this.localCache.set(key, entry);

    // Set in Redis
    try {
      await this.redis.setEx(key, config.ttl, JSON.stringify(entry));
    } catch (error) {
      console.warn('Redis cache set error:', error);
    }

    // Maintain local cache size
    this.evictIfNeeded(config.strategy);
  }

  /**
   * Delete from cache
   */
  async delete(key: string): Promise<void> {
    this.localCache.delete(key);
    try {
      await this.redis.del(key);
    } catch (error) {
      console.warn('Redis cache delete error:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.localCache.clear();
    try {
      // Note: This would need a more sophisticated approach for production
      // For now, we'll just clear local cache
    } catch (error) {
      console.warn('Redis cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    localCacheSize: number;
    hitRate: number;
    totalRequests: number;
    cacheHits: number;
  } {
    const entries = Array.from(this.localCache.values());
    const totalRequests = entries.reduce((sum, entry) => sum + entry.hits, 0);
    const cacheHits = entries.length; // Simplified - each entry represents a cache hit

    return {
      localCacheSize: this.localCache.size,
      hitRate: totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0,
      totalRequests,
      cacheHits,
    };
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmupCache(warmupData: Array<{ key: string; data: any; config: CacheConfig }>): Promise<void> {
    const promises = warmupData.map(({ key, data, config }) =>
      this.set(key, data, config)
    );

    await Promise.allSettled(promises);
  }

  /**
   * Implement cache warming strategies for common queries
   */
  async warmupCommonQueries(): Promise<void> {
    const warmupData = [
      // User count
      {
        key: 'stats:user_count',
        data: await this.getUserCount(),
        config: { ttl: 3600, strategy: 'TTL' as const }, // 1 hour
      },
      // Active users today
      {
        key: 'stats:active_users_today',
        data: await this.getActiveUsersToday(),
        config: { ttl: 1800, strategy: 'TTL' as const }, // 30 minutes
      },
      // Popular CBT exercises
      {
        key: 'cbt:popular_exercises',
        data: await this.getPopularExercises(),
        config: { ttl: 7200, strategy: 'TTL' as const }, // 2 hours
      },
    ];

    await this.warmupCache(warmupData);
  }

  /**
   * Implement intelligent cache invalidation
   */
  async invalidateUserData(userId: string): Promise<void> {
    const keysToDelete = [
      `user:${userId}:profile`,
      `user:${userId}:mood_history`,
      `user:${userId}:cbt_sessions`,
      `user:${userId}:analytics`,
    ];

    await Promise.allSettled(keysToDelete.map(key => this.delete(key)));
  }

  /**
   * Cache database query results with smart invalidation
   */
  async cachedQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    dependencies: string[] = [],
    config: CacheConfig = { ttl: 300, strategy: 'TTL' }
  ): Promise<T> {
    // Create composite cache key
    const cacheKey = `${queryKey}:${dependencies.sort().join(':')}`;

    return this.get(cacheKey, queryFn, config);
  }

  /**
   * Implement cache warming for user-specific data
   */
  async warmupUserCache(userId: string): Promise<void> {
    const userWarmupData = [
      {
        key: `user:${userId}:profile`,
        data: await this.getUserProfile(userId),
        config: { ttl: 3600, strategy: 'TTL' as const },
      },
      {
        key: `user:${userId}:recent_moods`,
        data: await this.getRecentMoods(userId),
        config: { ttl: 1800, strategy: 'TTL' as const },
      },
      {
        key: `user:${userId}:active_exercises`,
        data: await this.getActiveExercises(userId),
        config: { ttl: 7200, strategy: 'TTL' as const },
      },
    ];

    await this.warmupCache(userWarmupData);
  }

  // Private helper methods
  private isValid(entry: CacheEntry): boolean {
    const now = Date.now();
    const expiry = entry.timestamp + (entry.ttl * 1000);
    return now < expiry;
  }

  private evictIfNeeded(strategy: 'LRU' | 'LFU' | 'TTL'): void {
    if (this.localCache.size <= this.MAX_LOCAL_CACHE_SIZE) {
      return;
    }

    const entries = Array.from(this.localCache.entries());

    let entryToEvict: [string, CacheEntry] | undefined;

    switch (strategy) {
      case 'LRU':
        // Least Recently Used
        entryToEvict = entries.reduce((oldest, current) =>
          !oldest || current[1].timestamp < oldest[1].timestamp ? current : oldest
        );
        break;

      case 'LFU':
        // Least Frequently Used
        entryToEvict = entries.reduce((leastUsed, current) =>
          !leastUsed || current[1].hits < leastUsed[1].hits ? current : leastUsed
        );
        break;

      case 'TTL':
        // First to expire
        entryToEvict = entries.reduce((soonest, current) => {
          const currentExpiry = current[1].timestamp + (current[1].ttl * 1000);
          const soonestExpiry = soonest ? soonest[1].timestamp + (soonest[1].ttl * 1000) : Infinity;
          return currentExpiry < soonestExpiry ? current : soonest;
        });
        break;
    }

    if (entryToEvict) {
      this.localCache.delete(entryToEvict[0]);
    }
  }

  // Placeholder methods for cache warming
  private async getUserCount(): Promise<number> {
    // This would query the database
    return 0;
  }

  private async getActiveUsersToday(): Promise<number> {
    // This would query the database
    return 0;
  }

  private async getPopularExercises(): Promise<any[]> {
    // This would query the database
    return [];
  }

  private async getUserProfile(userId: string): Promise<any> {
    // This would query the database
    return {};
  }

  private async getRecentMoods(userId: string): Promise<any[]> {
    // This would query the database
    return [];
  }

  private async getActiveExercises(userId: string): Promise<any[]> {
    // This would query the database
    return [];
  }
}