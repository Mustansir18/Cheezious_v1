

'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { settings, isLoading: isSettingsLoading } = useSettings();
  const router = useRouter();
  const pathname = usePathname();

  const isLoading = isAuthLoading || isSettingsLoading;

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    const userRole = settings.roles.find(role => role.id === user.role);

    if (!userRole) {
        router.push('/login'); // Role not found, deny access
        return;
    }

    // Check if the user's role grants access to the current path.
    const hasAccess = userRole.permissions.includes('admin:*') 
        || userRole.permissions.includes(pathname)
        || (userRole.permissions.includes('/admin/kds') && pathname.startsWith('/admin/kds'));


    if (!hasAccess) {
        // If no access, redirect to a default page.
        if (user.role === 'admin') router.push('/admin/orders');
        else if (user.role === 'kds') router.push('/admin/kds');
        else if (user.role === 'make-station') router.push('/admin/kds/pizza');
        else if (user.role === 'pasta-station') router.push('/admin/kds/pasta');
        else if (user.role === 'fried-station') router.push('/admin/kds/fried');
        else if (user.role === 'bar-station') router.push('/admin/kds/bar');
        else if (user.role === 'cutt-station') router.push('/admin/kds/master');
        else if (user.role === 'cashier') router.push('/cashier');
        else if (user.role === 'marketing') router.push('/marketing/reporting');
        else router.push('/login'); // Fallback redirect
        return;
    }

  }, [user, isLoading, router, pathname, settings.roles]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  const userRole = settings.roles.find(role => role.id === user.role);
  const hasAccess = userRole && (
      userRole.permissions.includes('admin:*') 
      || userRole.permissions.includes(pathname)
      || (userRole.permissions.includes('/admin/kds') && pathname.startsWith('/admin/kds'))
  );

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
