
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
  // Start with loading true
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);

  // Initialize state with the provided initial value, not from localStorage
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Fetch from API on initial mount
  useEffect(() => {
    // This check prevents re-fetching on component re-mounts in development
    if (isInitialized.current) {
      return;
    }
    isInitialized.current = true;

    async function fetchInitialData() {
      try {
        const response = await fetch(apiPath);
        if (!response.ok) {
          throw new Error(`Failed to fetch from ${apiPath}. Status: ${response.status}`);
        }
        const data = await response.json();
        const dataKey = Object.keys(data)[0];

        if (data[dataKey]) {
             const serverData = data[dataKey];
             setStoredValue(serverData);
        } else {
             // If API returns empty data, we might be in first-run scenario.
             // We keep the initialValue provided to the hook.
             console.warn(`API response for ${apiPath} was empty. Using initial default data.`);
             setStoredValue(initialValue);
        }
      } catch (error) {
        console.error(`Could not load from API (${apiPath}), falling back to initial value.`, error);
        setStoredValue(initialValue);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiPath]); 

  const setValue: SetValue<T> = useCallback((value) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
  }, [storedValue]);
  
  return [storedValue, setValue, isLoading];
}
