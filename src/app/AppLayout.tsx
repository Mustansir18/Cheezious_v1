
'use client';

import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { MenuProvider } from '@/context/MenuContext';
import { DealsProvider } from '@/context/DealsContext';
import { OrderProvider } from '@/context/OrderContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { ActivityLogProvider } from '@/context/ActivityLogContext';
import { RatingProvider } from '@/context/RatingContext';
import { CashierLogProvider } from '@/context/CashierLogContext';

// This component now correctly wraps all client-side context providers.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ActivityLogProvider>
      <SettingsProvider>
        <MenuProvider>
          <CashierLogProvider>
            <CartProvider>
              <AuthProvider>
                <DealsProvider>
                  <OrderProvider>
                    <RatingProvider>
                      {children}
                    </RatingProvider>
                  </OrderProvider>
                </DealsProvider>
              </AuthProvider>
            </CartProvider>
          </CashierLogProvider>
        </MenuProvider>
      </SettingsProvider>
    </ActivityLogProvider>
  );
}
