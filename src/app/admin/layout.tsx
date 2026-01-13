

'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Home,
  Settings,
  Package,
  LayoutDashboard,
  Megaphone,
  Users,
  LogOut,
  ShoppingCart,
  QrCode,
  Monitor,
  ClipboardList,
  Star,
  BarChart,
  ChefHat,
  Activity,
  Landmark,
  FileUp,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { AdminRouteGuard } from '@/components/auth/AdminRouteGuard';
import { usePathname } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { useState, useEffect } from 'react';


function AdminSidebar() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const navLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, role: ['root', 'admin'] },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, role: ['root', 'admin'] },
    { href: '/admin/kds', label: 'KDS', icon: ChefHat, role: ['root', 'admin', 'kds', 'make-station', 'pasta-station', 'fried-station', 'bar-station', 'cutt-station'] },
    { href: '/admin/queue', label: 'Queue', icon: Monitor, role: ['root', 'admin'] },
    { href: '/admin/reporting', label: 'Sales Reports', icon: BarChart, role: ['root'] },
    { href: '/admin/cash-management', label: 'Cash Management', icon: Landmark, role: ['root'] },
    { href: '/admin/menu', label: 'Menu', icon: Package, role: ['root'] },
    { href: '/admin/deals', label: 'Deals', icon: Megaphone, role: ['root'] },
    { href: '/admin/qr-codes', label: 'QR Codes', icon: QrCode, role: ['root'] },
    { href: '/admin/feedback', label: 'Feedback', icon: Star, role: ['root'] },
    { href: '/admin/activity-log', label: 'Activity Log', icon: Activity, role: ['root'] },
    { href: '/admin/users', label: 'Users', icon: Users, role: ['root'] },
    { href: '/admin/settings', label: 'Settings', icon: Settings, role: ['root'] },
    { href: '/admin/migrate-data', label: 'Migrate Data', icon: FileUp, role: ['root'] },
  ];

  const visibleLinks = navLinks.filter(link => user?.role && link.role.includes(user.role));
  
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          href="/"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          {isMounted && typeof settings.companyLogo === 'string' && settings.companyLogo ? (
            <Image src={settings.companyLogo} alt={settings.companyName} width={32} height={32} className="object-contain" />
          ) : (
             <div style={{ width: 32, height: 32 }} />
          )}
          <span className="sr-only">{settings.companyName}</span>
        </Link>
        <TooltipProvider>
            {visibleLinks.map(link => (
                 <Tooltip key={link.href}>
                    <TooltipTrigger asChild>
                        <Link href={link.href}>
                        <Button 
                            variant={pathname.startsWith(link.href) ? 'default' : 'outline'} 
                            size="icon" 
                            aria-label={link.label}
                        >
                            <link.icon className="h-5 w-5" />
                        </Button>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{link.label}</TooltipContent>
                 </Tooltip>
            ))}
        </TooltipProvider>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <TooltipProvider>
         <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Logout" onClick={logout}>
                  <LogOut className="h-5 w-5" />
                </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Logout</TooltipContent>
          </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
              <Link href="/">
              <Button variant="outline" size="icon" aria-label="Back to App">
                <Home className="h-5 w-5" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Back to App</TooltipContent>
        </Tooltip>
        </TooltipProvider>
      </nav>
    </aside>
  );
}


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminRouteGuard>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
          <AdminSidebar />
          <main className="w-full sm:pl-14 p-4 sm:p-6 md:p-8">
              {children}
          </main>
        </div>
    </AdminRouteGuard>
  );
}
