
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { CashierRouteGuard } from '@/components/auth/CashierRouteGuard';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSettings } from '@/context/SettingsContext';
import { useState, useEffect } from 'react';

function CashierHeader() {
    const { logout } = useAuth();
    const { settings } = useSettings();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background">
            <div className="w-full flex h-16 items-center justify-between px-4 lg:px-8">
                <Link href="/" className="flex items-center gap-2">
                 {isMounted && settings.companyLogo ? (
                    <Image src={settings.companyLogo} alt={settings.companyName} width={40} height={40} className="object-contain" />
                  ) : (
                    <div style={{ width: 40, height: 40 }} />
                  )}
                <span className="hidden font-headline text-xl font-bold text-primary sm:inline-block">
                    {settings.companyName}
                </span>
                </Link>
                <div className="flex items-center gap-2">
                    <h1 className="font-headline text-lg font-semibold">Cashier View</h1>
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

export default function CashierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CashierRouteGuard>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <CashierHeader />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </CashierRouteGuard>
  );
}
