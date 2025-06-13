import { Redis } from '@upstash/redis'

console.log('Environment variables:', {
  UPSTASH_REDIS_URL: process.env.UPSTASH_REDIS_URL,
  UPSTASH_REDIS_TOKEN: process.env.UPSTASH_REDIS_TOKEN,
  // Log all env variables to check naming
  ALL_ENV: process.env
});

if (!process.env.UPSTASH_REDIS_URL) {
  throw new Error('UPSTASH_REDIS_URL is not defined');
}

if (!process.env.UPSTASH_REDIS_TOKEN) {
  throw new Error('UPSTASH_REDIS_TOKEN is not defined');
}

interface CacheMetadata {
  lastVisited: number;  // timestamp of last visit
  lastUpdated: number;  // timestamp of last data update
  visitCount: number;   // number of visits since last update
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
})

// Cache TTL in seconds
export const CACHE_TTL = {
  // Frequently changing data
  NOVEL_VIEWS: 300,      // 5 minutes
  NOVEL_RATINGS: 300,    // 5 minutes
  RECENT_NOVELS: 300,    // 5 minutes
  SEARCH: 300,          // 5 minutes

  // Moderately changing data
  NOVEL_LIST: 900,      // 15 minutes
  NOVEL: 1800,         // 30 minutes
  TOP_NOVELS: 1800,    // 30 minutes
  
  // Rarely changing data
  CHAPTER: 3600,       // 1 hour
  NOVEL_INFO: 3600,    // 1 hour (basic novel info)
  CATEGORIES: 7200,    // 2 hours
  
  // Static data
  COMPLETED_NOVELS: 86400,  // 24 hours
}

// Cache keys with namespacing
export const CACHE_KEYS = {
  NOVEL: (id: string) => `novel:${id}`,
  NOVEL_INFO: (id: string) => `novel:info:${id}`,
  NOVEL_LIST: 'novel:list',
  RECENT_NOVELS: 'novel:recent',
  TOP_NOVELS: 'novel:top',
  COMPLETED_NOVELS: 'novel:completed',
  CHAPTER: (novelId: string, chapterNumber: number) => `chapter:${novelId}:${chapterNumber}`,
  SEARCH: (query: string) => `search:${query}`,
  CATEGORIES: 'categories',
  NOVEL_VIEWS: (id: string) => `novel:views:${id}`,
  NOVEL_RATINGS: (id: string) => `novel:ratings:${id}`,
}

// Cache bypass conditions
export const shouldBypassCache = {
  // Bypass cache for admin/author operations
  isAuthorRequest: (userId?: string, authorId?: string) => userId === authorId,
  
  // Bypass cache for draft content
  isDraftContent: (status: string) => status === 'DRAFT',
  
  // Bypass cache for very recent content
  isRecentContent: (createdAt: Date) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return createdAt > fiveMinutesAgo;
  }
}

// Helper functions for SWR (Stale While Revalidate) caching
export const cacheHelpers = {
  // Get both data and metadata
  async getWithMetadata<T>(key: string): Promise<{ data: T | null; metadata: CacheMetadata | null }> {
    const [data, meta] = await Promise.all([
      redis.get(key),
      redis.get(`${key}:meta`)
    ]);
    return {
      data: data as T,
      metadata: meta as CacheMetadata
    };
  },

  // Set both data and update metadata
  async setWithMetadata<T>(key: string, data: T, ttl: number): Promise<void> {
    const now = Date.now();
    const metadata: CacheMetadata = {
      lastVisited: now,
      lastUpdated: now,
      visitCount: 1
    };

    await Promise.all([
      redis.set(key, data, { ex: ttl }),
      redis.set(`${key}:meta`, metadata, { ex: ttl })
    ]);
  },

  // Update just the metadata on visit
  async updateVisitMetadata(key: string): Promise<void> {
    const meta = await redis.get(`${key}:meta`) as CacheMetadata;
    if (meta) {
      meta.lastVisited = Date.now();
      meta.visitCount += 1;
      await redis.set(`${key}:meta`, meta, { 
        ex: CACHE_TTL.NOVEL // Use same TTL as main data
      });
    }
  },

  // Check if data needs revalidation
  shouldRevalidate(metadata: CacheMetadata | null): boolean {
    if (!metadata) return true;

    const now = Date.now();
    const timeSinceUpdate = now - metadata.lastUpdated;
    const isFrequentlyVisited = metadata.visitCount > 5;

    // Revalidate if:
    // 1. Data is older than TTL
    // 2. Content is frequently visited (>5 times) and hasn't been updated in 5 minutes
    return timeSinceUpdate > CACHE_TTL.NOVEL * 1000 || 
           (isFrequentlyVisited && timeSinceUpdate > 5 * 60 * 1000);
  }
}; 