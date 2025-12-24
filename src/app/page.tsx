
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { Loader } from 'lucide-react';

export default function Home() {
  const { settings, isLoading } = useSettings();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && settings.defaultBranchId) {
      router.replace(`/branch/${settings.defaultBranchId}`);
    } else if (!isLoading && settings.branches.length > 0) {
      // Fallback to the first branch if default is not set
      router.replace(`/branch/${settings.branches[0].id}`);
    }
    // If no branches, the user will see a message (or we can handle it differently)
  }, [isLoading, settings, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      {isLoading ? (
        <>
          <Loader className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading restaurant settings...</p>
        </>
      ) : settings.branches.length === 0 ? (
        <div className="text-center">
            <h1 className="font-headline text-2xl font-bold">Welcome to Cheezious</h1>
            <p className="mt-2 text-muted-foreground">No branches have been configured yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">Please log in as an admin to add a branch.</p>
        </div>
      ) : (
        <>
          <Loader className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Redirecting to your branch...</p>
        </>
      )}
    </main>
  );
}
