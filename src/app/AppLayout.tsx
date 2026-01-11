
'use client';

import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useMenu } from '@/context/MenuContext';
import { useOrders } from '@/context/OrderContext';
import { useSettings } from '@/context/SettingsContext';
import { useActivityLog } from '@/context/ActivityLogContext';
import { useRating } from '@/context/RatingContext';
import { useEffect } from 'react';

// This component's main purpose is now to just trigger the hooks
// that contain the cross-tab synchronization logic.
function StateSync() {
  useAuth();
  useCart();
  useMenu();
  useOrders();
  useSettings();
  useActivityLog();
  useRating();
  return null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StateSync />
      {children}
    </>
  );
}
