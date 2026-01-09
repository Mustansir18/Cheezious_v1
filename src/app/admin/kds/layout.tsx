
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChefHat, Pizza, CookingPot, Flame, Martini } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KitchenStation } from '@/lib/types';

interface StationLink {
    href: string;
    id: KitchenStation | 'master';
    name: string;
    icon: React.ElementType;
}

const stationLinks: StationLink[] = [
    { href: '/admin/kds/master', id: 'master', name: 'CUTT Station', icon: ChefHat },
    { href: '/admin/kds/pizza', id: 'pizza', name: 'MAKE Station', icon: Pizza },
    { href: '/admin/kds/pasta', id: 'pasta', name: 'PASTA Station', icon: CookingPot },
    { href: '/admin/kds/fried', id: 'fried', name: 'FRIED Station', icon: Flame },
    { href: '/admin/kds/bar', id: 'bar', name: 'BEVERAGES Station', icon: Martini },
];

function KdsHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-center bg-background/95 px-4 shadow-sm backdrop-blur-sm">
        <nav className="flex items-center gap-2 rounded-lg border bg-muted p-2">
            {stationLinks.map(link => {
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
    <div className="w-full flex flex-col">
        <KdsHeader />
        <main className="flex-1">
            {children}
        </main>
    </div>
  );
}
