
'use client';

// This file is deprecated and will be removed in a future update.
// All data fetching is now handled by the `useDataFetcher` hook powered by SWR.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './use-toast';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

type SetValue<T> = (value: T | ((val: T) => T)) => void;

export function useSyncLocalStorage<T>(
  key: string,
  initialValue: T,
  apiPath?: string
): [T, SetValue<T>, boolean] {
  const { data, error, isLoading, mutate } = useSWR(apiPath, fetcher, {
      fallbackData: { [key]: initialValue },
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
  });

  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
      if (data && data[key]) {
          setStoredValue(data[key]);
      } else if (data) {
          // API might return an object with a different key, e.g., { settings: {...} }
          const dataKey = Object.keys(data)[0];
          if (data[dataKey]) {
            setStoredValue(data[dataKey]);
          }
      }
  }, [data, key]);

  const setValue: SetValue<T> = useCallback((value) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    // Here you would typically also post the update to the server
    // and then call mutate() to re-fetch.
    // This logic is now handled in the individual context files.
  }, [storedValue]);
  
  return [storedValue, setValue, isLoading];
}
