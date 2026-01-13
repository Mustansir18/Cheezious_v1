
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
    if (isLoading) {
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    // --- FIX: Explicitly grant access to the root user immediately ---
    // The root user should bypass all other permission checks.
    if (user.role === 'root') {
      return; // Access granted, do nothing.
    }
    
    // For all other users, proceed with permission checks.
    if (!settings.roles || settings.roles.length === 0) {
        console.error("Roles not loaded in settings context. Cannot verify permissions.");
        router.push('/login');
        return;
    }

    const userRole = settings.roles.find(role => role.id === user.role);

    if (!userRole) {
        console.error(`Role '${user.role}' not found in settings. Denying access.`);
        router.push('/login'); 
        return;
    }

    const hasWildcardAccess = userRole.permissions.includes('admin:*');
    const hasDirectAccess = userRole.permissions.includes(pathname);
    
    const isKdsRoute = pathname.startsWith('/admin/kds');
    const hasKdsAccess = isKdsRoute && userRole.permissions.some(p => p.startsWith('/admin/kds'));
    
    const hasAccess = hasWildcardAccess || hasDirectAccess || hasKdsAccess;

    if (!hasAccess) {
      console.warn(`Access denied for user '${user.username}' to path '${pathname}'.`);
      router.push('/login');
    }

  }, [user, isLoading, router, pathname, settings.roles]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Verifying access...</p>
      </div>
    );
  }
  
  if (!user) {
      return (
            <div className="flex h-screen items-center justify-center">
                <Loader className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Access Denied. Redirecting...</p>
            </div>
      );
  }


  return <>{children}</>;
}
