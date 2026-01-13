
'use client';

import { useState, useEffect, useCallback } from 'react';

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
  apiPath: string | null,
  initialData: T
) {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<any>(null);
  const [trigger, setTrigger] = useState(0);

  const mutate = useCallback(() => {
    setTrigger(t => t + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      if (!apiPath) {
        if (isMounted) {
          setData(initialData);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(apiPath, { cache: 'no-store' });
        if (!response.ok) {
           const error = new Error('An error occurred while fetching the data.');
          (error as any).info = response.statusText;
          (error as any).status = response.status;
          throw error;
        }
        const json = await response.json();
        if (isMounted) {
          // API might return an object with a key, e.g., { settings: {...} } or { data: [...] }
          // Or it might be the data directly. We find the first key that holds the data.
          const dataKey = Object.keys(json)[0];
          setData(json[dataKey] ?? initialData);
        }
      } catch (error) {
        if (isMounted) {
          setIsError(error);
          console.error(`Failed to fetch from ${apiPath}:`, error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
    // The dependency array is critical. It ensures the fetch runs only when apiPath or the trigger changes.
  }, [apiPath, trigger, initialData]);

  return {
    data: data,
    isLoading,
    isError,
    mutate,
  };
}
