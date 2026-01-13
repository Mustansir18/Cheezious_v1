
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './use-toast';

type SetValue<T> = (value: T | ((val: T) => T)) => void;

export function useSyncLocalStorage<T>(
  key: string,
  initialValue: T,
  apiPath: string
): [T, SetValue<T>, boolean] {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);

  // Read initial value from localStorage if available
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      // If item exists and is not an empty array/object, parse it. Otherwise, use initial value.
      if (item && item !== '[]' && item !== '{}') {
        return JSON.parse(item);
      }
      // If local storage is empty or doesn't exist, set it with initial value.
      window.localStorage.setItem(key, JSON.stringify(initialValue));
      return initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  // Fetch from API on initial mount
  useEffect(() => {
    async function fetchInitialData() {
      if (isInitialized.current) {
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await fetch(apiPath);
        if (!response.ok) {
          throw new Error(`Failed to fetch from ${apiPath}. Status: ${response.status}`);
        }
        const data = await response.json();
        // The API should return an object where the data is under a key, e.g., { settings: {...} } or { menu: {...} } or { logs: [...] }
        const dataKey = Object.keys(data)[0];
        if (data[dataKey]) {
             const serverData = data[dataKey];
             // Check if server data is not empty before updating
             if (Array.isArray(serverData) ? serverData.length > 0 : (typeof serverData === 'object' && Object.keys(serverData).length > 0)) {
                setStoredValue(serverData);
                window.localStorage.setItem(key, JSON.stringify(serverData));
             }
        } else {
             console.warn(`API response for ${apiPath} did not contain expected key '${dataKey}' or data was empty.`);
        }
      } catch (error) {
        console.error(`Could not load from API (${apiPath}), falling back to local storage.`, error);
        // Don't show toast on initial load failure, as it might just be first-time setup
      } finally {
        setIsLoading(false);
        isInitialized.current = true;
      }
    }
    fetchInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiPath, key]); // Only run once on mount

  const setValue: SetValue<T> = useCallback(
    (value) => {
      // Don't run this if data hasn't been fetched from API yet
      if (!isInitialized.current) return;

      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      // Save to localStorage
      try {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(`Error setting localStorage key “${key}”:`, error);
      }
      
      // No need to POST back to API, as this hook is now for read-only sync from server
      // and local-first cache. All writes should go through explicit API calls in contexts.

    }, [key, storedValue]
  );
  
  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        try {
          setStoredValue(JSON.parse(event.newValue));
        } catch (error) {
          console.error("Failed to parse from storage event", error);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);


  return [storedValue, setValue, isLoading];
}
