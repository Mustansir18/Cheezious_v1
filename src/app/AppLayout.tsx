
'use client';

import { CartProvider } from '@/context/CartContext';
import { MenuProvider } from '@/context/MenuContext';
import { OrderProvider } from '@/context/OrderContext';
import { SettingsProvider } from '@/context/SettingsContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-grow">
        <SettingsProvider>
          <MenuProvider>
            <OrderProvider>
              <CartProvider>{children}</CartProvider>
            </OrderProvider>
          </MenuProvider>
        </SettingsProvider>
      </main>
    </div>
  );
}
