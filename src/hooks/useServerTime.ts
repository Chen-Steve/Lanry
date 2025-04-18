import { useState, useEffect } from 'react';

interface UseServerTimeOptions {
  refreshInterval?: number; // Time in ms to refresh the server time
  fallbackToClientTime?: boolean; // If true, use client time if server time fetch fails
}

const DEFAULT_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useServerTime({
  refreshInterval = DEFAULT_REFRESH_INTERVAL,
  fallbackToClientTime = true,
}: UseServerTimeOptions = {}) {
  const [serverTime, setServerTime] = useState<Date | null>(null);
  const [clientOffset, setClientOffset] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Function to get current server time based on last sync and offset
  const getCurrentServerTime = (): Date => {
    if (serverTime) {
      // Calculate current server time based on client offset
      const clientNow = new Date();
      return new Date(clientNow.getTime() + clientOffset);
    }
    
    // Fallback to client time if allowed and no server time is available yet
    if (fallbackToClientTime) {
      return new Date();
    }
    
    // Return invalid date if no fallback is allowed
    return new Date(NaN);
  };

  // Function to fetch the server time
  const fetchServerTime = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const clientTimeBeforeFetch = new Date();
      const response = await fetch('/api/server-time');
      const clientTimeAfterFetch = new Date();
      
      if (!response.ok) {
        throw new Error('Failed to fetch server time');
      }
      
      const data = await response.json();
      
      if (!data.serverTime) {
        throw new Error('Invalid server time response');
      }
      
      // Parse the server time string into a Date object
      const fetchedServerTime = new Date(data.serverTime);
      setServerTime(fetchedServerTime);
      
      // Calculate client-to-server time offset accounting for network latency
      const networkLatency = (clientTimeAfterFetch.getTime() - clientTimeBeforeFetch.getTime()) / 2;
      const midFetchClientTime = new Date(clientTimeBeforeFetch.getTime() + networkLatency);
      
      // Calculate offset as server time minus client time
      const offset = fetchedServerTime.getTime() - midFetchClientTime.getTime();
      setClientOffset(offset);
      
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch server time'));
      setIsLoading(false);
      
      // If fallback is enabled, use client time
      if (fallbackToClientTime) {
        setServerTime(new Date());
        setClientOffset(0);
      }
    }
  };

  // Initial fetch of server time
  useEffect(() => {
    fetchServerTime();
    
    // Set up refresh interval
    const intervalId = setInterval(fetchServerTime, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  return {
    serverTime: getCurrentServerTime,
    isServerTimeLoaded: serverTime !== null,
    isLoading,
    error,
    refetch: fetchServerTime,
  };
} 