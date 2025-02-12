import { getResponsiveImageUrl } from './imageService';

const CACHE_PREFIX = 'img_cache_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const MAX_ITEM_SIZE = 500 * 1024; // 500KB max per item

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
 * Estimates the size of a string in bytes
 */
const getStringSize = (str: string): number => {
  return new Blob([str]).size;
};

/**
 * Compresses a base64 image if it's too large
 */
const compressImage = async (base64: string, maxSize: number): Promise<string> => {
  if (getStringSize(base64) <= maxSize) return base64;

  // Convert base64 to blob
  const response = await fetch(base64);
  const blob = await response.blob();

  // Create an image element
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });

  // Create canvas for compression
  const canvas = document.createElement('canvas');
  let quality = 0.9;
  let compressed = base64;

  while (quality > 0.1 && getStringSize(compressed) > maxSize) {
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx?.drawImage(img, 0, 0);
    compressed = canvas.toDataURL('image/jpeg', quality);
    quality -= 0.1;
  }

  return compressed;
};

/**
 * Ensures there's enough space in localStorage
 */
const ensureStorageSpace = async (newItemSize: number): Promise<void> => {
  const cacheKeys = Object.keys(localStorage)
    .filter(key => key.startsWith(CACHE_PREFIX))
    .sort((a, b) => {
      const timeA = JSON.parse(localStorage.getItem(a) || '{}').timestamp || 0;
      const timeB = JSON.parse(localStorage.getItem(b) || '{}').timestamp || 0;
      return timeA - timeB;
    });

  // Remove oldest items until we have enough space
  while (cacheKeys.length > 0) {
    try {
      // Try adding a test item to see if we have space
      const testKey = `${CACHE_PREFIX}test`;
      const testData = 'x'.repeat(newItemSize);
      localStorage.setItem(testKey, testData);
      localStorage.removeItem(testKey);
      break;
    } catch {
      if (cacheKeys.length === 0) {
        throw new Error('Cannot free enough storage space');
      }
      const oldestKey = cacheKeys.shift();
      if (oldestKey) localStorage.removeItem(oldestKey);
    }
  }
};

/**
 * Caches an image in localStorage with error handling and compression
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

    // Compress image if needed
    const compressedBase64 = await compressImage(base64, MAX_ITEM_SIZE);

    // Ensure we have enough storage space
    await ensureStorageSpace(getStringSize(compressedBase64));

    // Store in cache
    const cacheItem: CachedImage = {
      data: compressedBase64,
      timestamp: Date.now(),
      size
    };

    localStorage.setItem(`${CACHE_PREFIX}${url}_${size}`, JSON.stringify(cacheItem));
    return compressedBase64;

  } catch (error) {
    console.warn('Error caching image:', error);
    // Fallback to original optimized URL without caching
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