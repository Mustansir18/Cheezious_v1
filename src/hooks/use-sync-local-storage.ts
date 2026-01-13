
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
  const [storedValue, setStoredValue] = useState<T>(initialValue);

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
             setStoredValue(serverData);
        } else {
             console.warn(`API response for ${apiPath} did not contain expected key '${dataKey}' or data was empty.`);
             setStoredValue(initialValue);
        }
      } catch (error) {
        console.error(`Could not load from API (${apiPath}), falling back to initial value.`, error);
        setStoredValue(initialValue);
        // Don't show toast on initial load failure, as it might just be first-time setup
      } finally {
        setIsLoading(false);
        isInitialized.current = true;
      }
    }
    fetchInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiPath, key]); // Only run once on mount

  const setValue: SetValue<T> = useCallback((value) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
  }, [storedValue]);
  
  return [storedValue, setValue, isLoading];
}
