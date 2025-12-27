
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, Pizza, Star, BarChart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { MarketingRouteGuard } from '@/components/auth/MarketingRouteGuard';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePathname } from 'next/navigation';

function MarketingHeader() {
    const { logout } = useAuth();
    const pathname = usePathname();
    
    const navLinks = [
        { href: '/marketing/reporting', label: 'Sales Reports', icon: BarChart },
        { href: '/marketing/feedback', label: 'Customer Feedback', icon: Star },
    ];

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2">
                    <Pizza className="h-8 w-8 text-primary" />
                    <span className="hidden font-headline text-xl font-bold text-primary sm:inline-block">
                        Cheezious
                    </span>
                </Link>
                
                <nav className="flex items-center gap-2 rounded-lg border bg-muted p-1">
                    {navLinks.map(link => (
                        <Link href={link.href} key={link.href}>
                            <Button 
                                variant={pathname === link.href ? 'default' : 'ghost'} 
                                size="sm"
                            >
                                <link.icon className="mr-2 h-4 w-4" />
                                {link.label}
                            </Button>
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-4">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label="Logout" onClick={logout}>
                                    <LogOut className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Logout</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
        </header>
    )
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MarketingRouteGuard>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <MarketingHeader />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </MarketingRouteGuard>
  );
}
