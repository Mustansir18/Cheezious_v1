
'use client';

import useSWR from 'swr';

// A simple fetcher function that assumes JSON responses.
const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) {
        const error = new Error('An error occurred while fetching the data.');
        // Attach extra info to the error object.
        (error as any).info = res.statusText;
        (error as any).status = res.status;
        throw error;
    }
    return res.json();
});

/**
 * A generic hook to fetch data from an API endpoint using SWR.
 * It handles loading, error, and data states.
 * 
 * @param apiPath The path to the API endpoint (e.g., '/api/settings').
 * @param initialData The initial data to use before the fetch is complete.
 * @returns An object containing the fetched data, loading state, error state, and a mutate function.
 */
export function useDataFetcher<T>(apiPath: string, initialData: T) {
  const { data, error, isLoading, mutate } = useSWR(apiPath, fetcher, {
    fallbackData: initialData, // Use provided initial data as fallback
    revalidateOnFocus: true,   // Automatically re-fetch when the window gains focus
    revalidateOnReconnect: true, // Automatically re-fetch on reconnect
  });

  const dataKey = data ? Object.keys(data)[0] : undefined;
  const extractedData = data && dataKey ? data[dataKey] : initialData;
  
  return {
    data: extractedData as T,
    isLoading,
    isError: error,
    mutate,
  };
}
