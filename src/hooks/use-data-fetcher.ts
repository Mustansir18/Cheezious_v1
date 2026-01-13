
'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * A generic hook to fetch data from an API endpoint using built-in React hooks.
 * It handles loading, error, and data states, and provides a `mutate` function to re-fetch.
 *
 * @param apiPath The path to the API endpoint (e.g., '/api/settings').
 * @param initialData The initial data to use before the fetch is complete.
 * @returns An object containing the fetched data, loading state, error state, and a mutate function.
 */
export function useDataFetcher<T>(apiPath: string, initialData: T) {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<any>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  const fetcher = useCallback(async () => {
    setIsLoading(true);
    setIsError(null);
    try {
      const res = await fetch(apiPath);
      if (!res.ok) {
        const error = new Error('An error occurred while fetching the data.');
        (error as any).info = res.statusText;
        (error as any).status = res.status;
        throw error;
      }
      const jsonData = await res.json();
      const dataKey = Object.keys(jsonData)[0];
      const extractedData = jsonData[dataKey] ?? initialData;
      setData(extractedData);
    } catch (error) {
      setIsError(error);
      console.error(`Failed to fetch from ${apiPath}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [apiPath, initialData]);

  useEffect(() => {
    fetcher();
  }, [fetcher, refreshToggle]);

  const mutate = useCallback(() => {
    setRefreshToggle(prev => !prev);
  }, []);
  
  return {
    data,
    isLoading,
    isError,
    mutate,
  };
}
