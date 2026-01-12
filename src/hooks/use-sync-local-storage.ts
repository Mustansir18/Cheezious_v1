
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
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  // Fetch from API on initial mount
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const response = await fetch(apiPath);
        if (!response.ok) {
          throw new Error(`Failed to fetch from ${apiPath}. Status: ${response.status}`);
        }
        const data = await response.json();
        // The API should return an object where the data is under a key, e.g., { settings: {...} }
        const dataKey = Object.keys(data)[0]; // e.g. 'settings', 'menu' etc.
        if (data[dataKey] && Array.isArray(data[dataKey]) ? data[dataKey].length > 0 : data[dataKey]) {
             setStoredValue(data[dataKey]);
             window.localStorage.setItem(key, JSON.stringify(data[dataKey]));
        } else {
             console.warn(`API response for ${apiPath} did not contain expected key '${dataKey}' or data was empty.`);
        }
      } catch (error) {
        console.error(`Could not load from API (${apiPath}), falling back to local storage.`, error);
        toast({
          variant: 'destructive',
          title: `Sync Error: ${key}`,
          description: `Could not connect to the server. Some data may be outdated.`,
        });
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
      
      // Post to API - this is fire-and-forget for now
      // A more robust solution would handle queuing and retries
      const dataToPost = { [key.replace(/cheezious|V\d/g, '').toLowerCase()]: valueToStore };
      fetch(apiPath, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToPost)
      }).catch(err => {
          console.error(`Failed to sync data to ${apiPath}`, err);
          toast({
              variant: 'destructive',
              title: `Sync Error: ${key}`,
              description: 'Your recent changes could not be saved to the server.'
          });
      });
    },
    [apiPath, key, toast, storedValue]
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
