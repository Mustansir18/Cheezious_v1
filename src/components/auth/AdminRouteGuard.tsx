
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
    // Wait until both user and settings (especially roles) are loaded
    if (isLoading) {
      return;
    }

    // If no user is logged in after loading, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Explicitly check if roles are loaded. This is the key fix.
    if (!settings.roles || settings.roles.length === 0) {
        console.error("Roles not loaded in settings context. Cannot verify permissions.");
        // This is a critical state, something is wrong with settings loading.
        // For safety, redirect to login.
        router.push('/login');
        return;
    }

    // Find the user's role from the loaded settings
    const userRole = settings.roles.find(role => role.id === user.role);

    // If the user's role definition doesn't exist in settings, deny access.
    if (!userRole) {
        console.error(`Role '${user.role}' not found in settings. Denying access.`);
        router.push('/login'); 
        return;
    }

    // Check permissions
    const hasWildcardAccess = userRole.permissions.includes('admin:*');
    const hasDirectAccess = userRole.permissions.includes(pathname);
    
    // Special check for nested KDS routes (e.g., /admin/kds/pizza)
    const isKdsRoute = pathname.startsWith('/admin/kds');
    const hasKdsAccess = isKdsRoute && userRole.permissions.some(p => p.startsWith('/admin/kds'));
    
    const hasAccess = hasWildcardAccess || hasDirectAccess || hasKdsAccess;

    if (!hasAccess) {
      // If user doesn't have permission, send them to login.
      router.push('/login');
    }

  }, [user, isLoading, router, pathname, settings.roles]);

  // While loading, show a loading screen.
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  // Final check to prevent rendering children if user is not authenticated or authorized
  const userRole = settings.roles.find(role => role.id === user?.role);
  if (!user || !userRole) {
     return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

   const hasWildcardAccess = userRole.permissions.includes('admin:*');
   const hasDirectAccess = userRole.permissions.includes(pathname);
   const isKdsRoute = pathname.startsWith('/admin/kds');
   const hasKdsAccess = isKdsRoute && userRole.permissions.some(p => p.startsWith('/admin/kds'));
   const hasAccess = hasWildcardAccess || hasDirectAccess || hasKdsAccess;

   if(!hasAccess) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-muted-foreground">Access Denied. Redirecting...</p>
            </div>
        );
   }

  // If the user is authorized, render the admin layout and its children.
  return <>{children}</>;
}
