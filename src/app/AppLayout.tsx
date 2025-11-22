'use client';

import { CartProvider } from '@/context/CartContext';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import Link from 'next/link';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // Ensure user is signed in anonymously
  useUser();

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-grow">
        <CartProvider>{children}</CartProvider>
      </main>
      <footer className="mt-auto border-t py-4 text-center text-sm text-muted-foreground">
        <div className="container">
          <Button asChild variant="ghost" className="text-muted-foreground">
            <Link href="/cashier">
              <LogIn className="mr-2 h-4 w-4" />
              Cashier
            </Link>
          </Button>
          <span className="mx-2">|</span>
          <Button asChild variant="ghost" className="text-muted-foreground">
            <Link href="/kds">
              <LogIn className="mr-2 h-4 w-4" />
              Kitchen
            </Link>
          </Button>
          <p className="mt-2">
            &copy; {new Date().getFullYear()} Cheezious Connect. All Rights
            Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
