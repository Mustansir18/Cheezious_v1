

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
    // Wait until both user and settings are loaded
    if (isLoading) {
      return;
    }

    // If no user, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }

    // Find the user's role from the loaded settings
    const userRole = settings.roles.find(role => role.id === user.role);

    // If role doesn't exist in settings, it's a critical config error. Deny access.
    if (!userRole) {
        console.error(`Role '${user.role}' not found in settings. Denying access.`);
        router.push('/login'); 
        return;
    }

    // Check permissions
    const hasWildcardAccess = userRole.permissions.includes('admin:*');
    const hasDirectAccess = userRole.permissions.includes(pathname);
    // Special check for nested KDS routes
    const isKdsRoute = pathname.startsWith('/admin/kds');
    const hasKdsAccess = isKdsRoute && userRole.permissions.some(p => p.startsWith('/admin/kds'));
    
    const hasAccess = hasWildcardAccess || hasDirectAccess || hasKdsAccess;

    if (!hasAccess) {
      // If user doesn't have permission, send them to login.
      // In a real app, you might show an "Access Denied" page.
      router.push('/login');
    }

  }, [user, isLoading, router, pathname, settings.roles]);

  // While loading, or if the user is not authenticated yet, show a loading screen.
  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  // Final check to prevent rendering children if access is denied while redirecting
  const userRole = settings.roles.find(role => role.id === user.role);
   const hasWildcardAccess = userRole?.permissions.includes('admin:*');
   const hasDirectAccess = userRole?.permissions.includes(pathname);
   const isKdsRoute = pathname.startsWith('/admin/kds');
   const hasKdsAccess = isKdsRoute && userRole?.permissions.some(p => p.startsWith('/admin/kds'));
   const hasAccess = hasWildcardAccess || hasDirectAccess || hasKdsAccess;


  if (!userRole || !hasAccess) {
     return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Access Denied. Redirecting...</p>
      </div>
    );
  }

  // If the user is authorized, render the admin layout and its children.
  return <>{children}</>;
}
