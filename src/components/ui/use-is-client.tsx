
'use client';

import { useState, useEffect } from 'react';

/**
 * A hook to safely determine if a component is running on the client.
 * 
 * @returns `true` if the component is on the client after hydration, otherwise `false`.
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}
