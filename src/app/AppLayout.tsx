
'use client';

import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { DealsProvider } from '@/context/DealsContext';
import { MenuProvider } from '@/context/MenuContext';
import { OrderProvider } from '@/context/OrderContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { ActivityLogProvider } from '@/context/ActivityLogContext';
import { RatingProvider } from '@/context/RatingContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ActivityLogProvider>
      <AuthProvider>
        <SettingsProvider>
          <DealsProvider>
            <MenuProvider>
              <OrderProvider>
                <RatingProvider>
                  <CartProvider>{children}</CartProvider>
                </RatingProvider>
              </OrderProvider>
            </MenuProvider>
          </DealsProvider>
        </SettingsProvider>
      </AuthProvider>
    </ActivityLogProvider>
  );
}
