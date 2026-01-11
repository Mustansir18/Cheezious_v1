
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChefHat, Pizza, CookingPot, Flame, Martini } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KitchenStation, UserRole } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

interface StationLink {
    href: string;
    id: KitchenStation | 'master';
    name: string;
    icon: React.ElementType;
    requiredRole: UserRole;
}

const allStationLinks: StationLink[] = [
    { href: '/admin/kds/pizza', id: 'pizza', name: 'MAKE Station', icon: Pizza, requiredRole: 'make-station' },
    { href: '/admin/kds/pasta', id: 'pasta', name: 'PASTA Station', icon: CookingPot, requiredRole: 'pasta-station' },
    { href: '/admin/kds/fried', id: 'fried', name: 'FRIED Station', icon: Flame, requiredRole: 'fried-station' },
    { href: '/admin/kds/bar', id: 'bar', name: 'BEVERAGES Station', icon: Martini, requiredRole: 'bar-station' },
    { href: '/admin/kds/master', id: 'master', name: 'CUTT Station', icon: ChefHat, requiredRole: 'cutt-station' },
];

function KdsHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const hasFullAccess = user?.role === 'root' || user?.role === 'admin' || user?.role === 'kds';

  const visibleLinks = hasFullAccess 
    ? allStationLinks 
    : allStationLinks.filter(link => link.requiredRole === user?.role);


  // Don't render the header if a station user is logged in and they have only one station to see.
  if (!hasFullAccess && visibleLinks.length <= 1) {
      return null;
  }

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-center bg-background/95 px-4 shadow-sm backdrop-blur-sm">
        <nav className="flex items-center gap-2 rounded-lg border bg-muted p-2">
            {visibleLinks.map(link => {
                const isActive = pathname === link.href;
                return (
                    <Link href={link.href} key={link.id}>
                        <div
                            className={cn(
                                "flex items-center gap-2 rounded-md px-4 py-2 text-lg font-semibold transition-colors",
                                isActive 
                                    ? "bg-primary text-primary-foreground shadow-md" 
                                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                            )}
                        >
                            <link.icon className="h-6 w-6" />
                            {link.name}
                        </div>
                    </Link>
                )
            })}
        </nav>
    </header>
  );
}

export default function KDSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full flex flex-col h-screen overflow-hidden">
        <KdsHeader />
        <main className="flex-1 overflow-y-auto">
            {children}
        </main>
    </div>
  );
}
