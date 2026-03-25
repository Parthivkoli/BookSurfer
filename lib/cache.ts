/**
 * Advanced Caching Layer for API Responses
 * Implements in-memory LRU cache with configurable TTL per content type
 * Optimized for high-frequency API calls with fallback strategies
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

interface CacheConfig {
  maxSize?: number;
  defaultTTL?: number;
}

export class CacheManager<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private maxSize: number;
  private defaultTTL: number;

  constructor(config: CacheConfig = {}) {
    this.maxSize = config.maxSize || 1000;
    this.defaultTTL = config.defaultTTL || 3600000; // 1 hour default
  }

  /**
   * Get cached value if valid
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if cache entry has expired
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count for LRU eviction
    entry.hits++;
    return entry.data;
  }

  /**
   * Set cache value with optional TTL
   */
  set(key: string, data: T, ttl?: number): void {
    // Evict least recently used item if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      let lruKey: string | null = null;
      let minHits = Infinity;
      
      for (const [k, v] of this.cache.entries()) {
        if (v.hits < minHits) {
          minHits = v.hits;
          lruKey = k;
        }
      }
      
      if (lruKey) {
        this.cache.delete(lruKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      hits: 0,
    });
  }

  /**
   * Delete specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear cache by pattern (prefix)
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(`^${pattern}`);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: Array.from(this.cache.values()).reduce((sum, v) => sum + v.hits, 0) / Math.max(this.cache.size, 1),
    };
  }
}

/**
 * Cache TTL configurations for different content types
 */
export const CACHE_DURATIONS = {
  // Static content (books, authors) - can be cached longer
  BOOKS: 24 * 60 * 60 * 1000, // 24 hours
  AUTHORS: 24 * 60 * 60 * 1000, // 24 hours
  CATEGORIES: 7 * 24 * 60 * 60 * 1000, // 7 days
  
  // Semi-dynamic content (search results, trending)
  SEARCH: 2 * 60 * 60 * 1000, // 2 hours
  TRENDING: 1 * 60 * 60 * 1000, // 1 hour
  
  // Dynamic content (user data)
  USER_LIBRARY: 5 * 60 * 1000, // 5 minutes
  USER_PROGRESS: 1 * 60 * 1000, // 1 minute
};

/**
 * Create cache key from parameters
 */
export function createCacheKey(...parts: (string | number | undefined)[]): string {
  return parts.filter(p => p !== undefined).join(':');
}

// Global caches for different data types
export const bookCache = new CacheManager<any>({
  maxSize: 500,
  defaultTTL: CACHE_DURATIONS.BOOKS,
});

export const searchCache = new CacheManager<any>({
  maxSize: 100,
  defaultTTL: CACHE_DURATIONS.SEARCH,
});

export const userCache = new CacheManager<any>({
  maxSize: 50,
  defaultTTL: CACHE_DURATIONS.USER_LIBRARY,
});

/**
 * Fetch with caching
 */
export async function fetchWithCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  cache: CacheManager<T>,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cached = cache.get(key);
  if (cached !== null) {
    console.log(`[Cache HIT] ${key}`);
    return cached;
  }

  // Fetch if not in cache
  try {
    const data = await fetchFn();
    cache.set(key, data, ttl);
    console.log(`[Cache SET] ${key}`);
    return data;
  } catch (error) {
    console.error(`[Cache MISS] ${key}:`, error);
    throw error;
  }
}
