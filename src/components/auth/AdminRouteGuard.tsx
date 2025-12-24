
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader } from 'lucide-react';

const ROOT_ONLY_PAGES = [
    '/admin/settings',
    '/admin/users',
    '/admin/menu',
    '/admin/deals',
    '/admin/qr-codes',
];

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not logged in, redirect to login page
        router.push('/login');
        return;
      } 
      
      if (user.role !== 'root' && user.role !== 'admin') {
        // Logged in, but not an admin or root, redirect to their default page
        router.push('/cashier'); 
        return;
      }
      
      // If user is an admin (not root) and tries to access a root-only page
      if (user.role === 'admin' && ROOT_ONLY_PAGES.includes(pathname)) {
        router.push('/admin'); // Redirect to their allowed dashboard
        return;
      }
    }
  }, [user, isLoading, router, pathname]);

  // Initial loading state
  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  // If user is not authorized for this specific admin page
  if (user.role !== 'root' && user.role !== 'admin') {
     return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

   // If a branch admin tries to access a page they shouldn't
  if (user.role === 'admin' && ROOT_ONLY_PAGES.includes(pathname)) {
      return (
        <div className="flex h-screen items-center justify-center">
            <Loader className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Access Denied. Redirecting...</p>
        </div>
      );
  }


  return <>{children}</>;
}
