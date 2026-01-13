
'use client';

import { useState, useEffect, useCallback } from 'react';
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
export function useDataFetcher<T>(apiPath: string, initialData: T | null = null) {
  const { data, error, isLoading, mutate } = useSWR(apiPath, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const responseData = data ? (Object.values(data)[0] as T) : initialData;

  return {
    data: responseData,
    isLoading,
    isError: error,
    mutate,
  };
}
