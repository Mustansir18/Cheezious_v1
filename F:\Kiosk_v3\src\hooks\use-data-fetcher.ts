
'use client';

import useSWR from 'swr';

// A simple fetcher function that assumes JSON responses.
const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) {
    throw new Error('An error occurred while fetching the data.');
  }
  return res.json();
});

/**
 * A hook to fetch data from an API endpoint using SWR.
 * It handles loading, error, and data states, and provides a `mutate` function to re-fetch.
 * SWR automatically handles caching, revalidation on focus, and more.
 *
 * @param apiPath The path to the API endpoint (e.g., '/api/settings').
 * @returns An object containing the fetched data, loading state, error state, and a mutate function.
 */
export function useDataFetcher<T>(apiPath: string) {
  const { data, error, isLoading, mutate } = useSWR<T>(apiPath, fetcher, {
    revalidateOnFocus: true, // Re-fetch when the window gains focus
    revalidateOnReconnect: true, // Re-fetch when the network connection is restored
  });

  return {
    data,
    isLoading,
    isError: error,
    mutate,
  };
}
