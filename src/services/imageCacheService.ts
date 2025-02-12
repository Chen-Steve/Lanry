import { getResponsiveImageUrl } from './imageService';

const CACHE_PREFIX = 'img_cache_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 50; // Maximum number of images to cache

interface CachedImage {
  data: string;
  timestamp: number;
  size: string;
}

/**
 * Checks if an image is cached and not expired
 */
const isCacheValid = (cached: CachedImage | null): boolean => {
  if (!cached) return false;
  return Date.now() - cached.timestamp < CACHE_EXPIRY;
};

/**
 * Gets an image from cache if it exists
 */
export const getCachedImage = (url: string, size: string): string | null => {
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${url}_${size}`);
    if (!cached) return null;

    const parsedCache: CachedImage = JSON.parse(cached);
    if (!isCacheValid(parsedCache)) {
      localStorage.removeItem(`${CACHE_PREFIX}${url}_${size}`);
      return null;
    }

    return parsedCache.data;
  } catch (error) {
    console.warn('Error reading from image cache:', error);
    return null;
  }
};

/**
 * Caches an image in localStorage
 */
export const cacheImage = async (
  url: string, 
  size: 'thumbnail' | 'small' | 'medium' | 'large'
): Promise<string> => {
  try {
    // Check cache first
    const cached = getCachedImage(url, size);
    if (cached) return cached;

    // Get optimized URL
    const optimizedUrl = getResponsiveImageUrl(url, size);

    // Fetch and convert to base64
    const response = await fetch(optimizedUrl);
    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

    // Manage cache size before adding new item
    const cacheKeys = Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX))
      .sort((a, b) => {
        const timeA = JSON.parse(localStorage.getItem(a) || '{}').timestamp || 0;
        const timeB = JSON.parse(localStorage.getItem(b) || '{}').timestamp || 0;
        return timeA - timeB;
      });

    // Remove oldest items if cache is full
    while (cacheKeys.length >= MAX_CACHE_SIZE) {
      const oldestKey = cacheKeys.shift();
      if (oldestKey) localStorage.removeItem(oldestKey);
    }

    // Store in cache
    const cacheItem: CachedImage = {
      data: base64,
      timestamp: Date.now(),
      size
    };
    localStorage.setItem(`${CACHE_PREFIX}${url}_${size}`, JSON.stringify(cacheItem));

    return base64;
  } catch (error) {
    console.warn('Error caching image:', error);
    // Fallback to original optimized URL
    return getResponsiveImageUrl(url, size);
  }
};

/**
 * Clears expired images from cache
 */
export const clearExpiredCache = (): void => {
  try {
    Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX))
      .forEach(key => {
        const cached = JSON.parse(localStorage.getItem(key) || '{}');
        if (!isCacheValid(cached)) {
          localStorage.removeItem(key);
        }
      });
  } catch (error) {
    console.warn('Error clearing expired cache:', error);
  }
}; 