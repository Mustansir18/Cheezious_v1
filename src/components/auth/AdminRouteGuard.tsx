

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
        console.error(`Role '${user.role}' not found in settings. Denying access.`);
        router.push('/login'); // Role not found, deny access
        return;
    }

    // Check if the user's role grants access to the current path.
    // This is the core permission check.
    const hasAccess = userRole.permissions.includes('admin:*') 
        || userRole.permissions.includes(pathname)
        || (pathname.startsWith('/admin/kds/') && userRole.permissions.includes('/admin/kds'));


    if (!hasAccess) {
        // If user is trying to access a page they don't have permission for,
        // send them back to the login page.
        router.push('/login');
        return;
    }

  }, [user, isLoading, router, pathname, settings.roles]);

  // While loading, or if the user is not authenticated, show a loading screen.
  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  // This final check ensures that even after loading, if access is denied for any reason, we don't render the children.
  const userRole = settings.roles.find(role => role.id === user.role);
  const hasAccess = userRole && (
      userRole.permissions.includes('admin:*') 
      || userRole.permissions.includes(pathname)
      || (pathname.startsWith('/admin/kds/') && userRole.permissions.includes('/admin/kds'))
  );

  if (!hasAccess) {
     return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Access Denied. Redirecting...</p>
      </div>
    );
  }

  // If the user is authorized, render the admin layout and its children.
  // Special case for queue page to render without admin layout.
  if (pathname === '/admin/queue') {
    return <>{children}</>;
  }

  return <>{children}</>;
}
