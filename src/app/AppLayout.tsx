'use client';

import { CartProvider } from '@/context/CartContext';
import { useUser } from '@/firebase';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // Ensure user is signed in anonymously
  useUser();

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-grow">
        <CartProvider>{children}</CartProvider>
      </main>
    </div>
  );
}
