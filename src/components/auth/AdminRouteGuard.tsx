
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader } from 'lucide-react';
import rolesConfig from '@/config/roles.json';
import type { Role } from '@/lib/types';

const allRoles: Role[] = rolesConfig.roles;

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    const userRole = allRoles.find(role => role.id === user.role);

    if (!userRole) {
        router.push('/login'); // Role not found, deny access
        return;
    }

    // Check if the user's role grants access to the current path.
    // The 'admin' role is a special case which gives access to all admin pages.
    const hasAccess = userRole.permissions.includes('admin:*') || userRole.permissions.includes(pathname);

    if (!hasAccess) {
        // If no access, redirect to a default page.
        // This could be the user's primary dashboard or the main login page.
        if (user.role === 'cashier') {
             router.push('/cashier');
        } else if (user.role === 'marketing') {
            router.push('/marketing/reporting');
        } else {
             router.push('/login');
        }
        return;
    }

  }, [user, isLoading, router, pathname]);

  // Initial loading state or if redirection is about to happen
  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  const userRole = allRoles.find(role => role.id === user.role);
  const hasAccess = userRole && (userRole.permissions.includes('admin:*') || userRole.permissions.includes(pathname));

  if (!hasAccess) {
     return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  // If we are on the queue page, don't show the sidebar/layout, just the page content
  if (pathname === '/admin/queue' && hasAccess) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
