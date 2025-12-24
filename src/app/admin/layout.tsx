'use client';

import Link from 'next/link';
import {
  Home,
  Settings,
  Package,
  BarChart4,
  LayoutDashboard,
  Megaphone,
  Users,
  LogOut,
  ShoppingCart,
  Pizza,
  QrCode,
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


function AdminSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, role: ['root', 'admin'] },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, role: ['root', 'admin'] },
    { href: '/admin/reporting', label: 'Reporting', icon: BarChart4, role: ['root', 'admin'] },
    { href: '/admin/menu', label: 'Menu', icon: Package, role: ['root'] },
    { href: '/admin/deals', label: 'Deals', icon: Megaphone, role: ['root'] },
    { href: '/admin/qr-codes', label: 'QR Codes', icon: QrCode, role: ['root'] },
    { href: '/admin/users', label: 'Users', icon: Users, role: ['root'] },
    { href: '/admin/settings', label: 'Settings', icon: Settings, role: ['root'] },
  ];

  const visibleLinks = navLinks.filter(link => user?.role && link.role.includes(user.role));
  
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          href="/"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          <Pizza className="h-5 w-5 transition-all group-hover:scale-110" />
          <span className="sr-only">Cheezious</span>
        </Link>
        <TooltipProvider>
            {visibleLinks.map(link => (
                 <Tooltip key={link.href}>
                    <TooltipTrigger asChild>
                        <Link href={link.href}>
                        <Button 
                            variant={pathname === link.href ? 'default' : 'outline'} 
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
          <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
              {children}
            </main>
          </div>
        </div>
    </AdminRouteGuard>
  );
}
