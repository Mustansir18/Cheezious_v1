
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
// AuthProvider is at the top level as other providers depend on it.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ActivityLogProvider>
          <MenuProvider>
            <CashierLogProvider>
              <CartProvider>
                <DealsProvider>
                  <OrderProvider>
                    <RatingProvider>
                      {children}
                    </RatingProvider>
                  </OrderProvider>
                </DealsProvider>
              </CartProvider>
            </CashierLogProvider>
          </MenuProvider>
        </ActivityLogProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
