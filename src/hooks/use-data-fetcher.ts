
'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(res => {
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    (error as any).info = res.statusText;
    (error as any).status = res.status;
    throw error;
  }
  return res.json();
});

export function useDataFetcher<T>(
  apiPath: string | null, // Allow null to disable fetching
  initialData: T
) {
  const { data, error, isLoading, mutate } = useSWR(apiPath, fetcher, {
    fallbackData: { [Object.keys(initialData)[0] || 'data']: initialData }, // Improved fallback
    revalidateOnFocus: false, // Prevent re-fetching on window focus
    revalidateOnReconnect: true,
  });

  const [storedValue, setStoredValue] = useState<T>(initialData);

  useEffect(() => {
    if (data) {
      // API might return an object with a key, e.g., { settings: {...} }
      // Or it might be the data directly. We find the first key.
      const dataKey = Object.keys(data)[0];
      const extractedData = data[dataKey] ?? initialData;
      setStoredValue(extractedData);
    } else if (!apiPath) {
      // If API path is null, reset to initial data
      setStoredValue(initialData);
    }
  }, [data, apiPath, initialData]);
  
  return {
    data: storedValue,
    isLoading,
    isError: error,
    mutate,
  };
}
