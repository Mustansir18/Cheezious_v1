
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import type { Order, OrderStatus, OrderItem, CartItem } from '@/lib/types';
import { useActivityLog } from './ActivityLogContext';
import { useAuth } from './AuthContext';
import { useMenu } from './MenuContext';
import { useSettings } from './SettingsContext';
import { useToast } from '@/hooks/use-toast';
import { useDataFetcher } from '@/hooks/use-data-fetcher';

interface OrderContextType {
  orders: Order[];
  isLoading: boolean;
  addOrder: (order: Order) => void;
  addItemsToOrder: (orderId: string, itemsToAdd: CartItem[]) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, reason?: string) => void;
  toggleItemPrepared: (orderId: string, itemIds: string[]) => void;
  dispatchItem: (orderId: string, itemId: string) => void;
  applyDiscountOrComplementary: (orderId: string, details: { discountType?: 'percentage' | 'amount', discountValue?: number, isComplementary?: boolean, complementaryReason?: string }) => void;
  changePaymentMethod: (orderId: string, newPaymentMethod: string) => void;
  clearOrders: () => void;
  occupiedTableIds: Set<string>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth(); // Use auth context to check for logged-in user
  // This is the fix: Only fetch orders if a user is logged in.
  const { data: orders, isLoading, mutate } = useDataFetcher<Order[]>(user ? '/api/orders' : null, []);
  const { logActivity } = useActivityLog();
  const { updateUserBalance } = useAuth();
  const { menu } = useMenu();
  const { settings } = useSettings();
  const { toast } = useToast();

  const occupiedTableIds = useMemo(() => {
    if (!orders) return new Set();
    const ids = orders
        .filter(o => o.orderType === 'Dine-In' && o.tableId && ['Pending', 'Preparing', 'Ready', 'Partial Ready'].includes(o.status))
        .map(o => o.tableId!);
    return new Set(ids);
  }, [orders]);

  const addOrder = useCallback(async (order: Order) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      if (!response.ok) throw new Error('Failed to save order.');
      
      logActivity(`Placed new Order #${order.orderNumber}.`, user?.username || 'Customer', 'Order');
      mutate(); // Re-fetch orders to include the new one
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Order Failed', description: error.message });
    }
  }, [toast, mutate, logActivity, user]);

  const updateOrderAPI = useCallback(async (orderId: string, payload: any) => {
    const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update order.');
    }
    mutate(); // Re-fetch all orders
  }, [mutate]);


  const addItemsToOrder = useCallback(async (orderId: string, itemsToAdd: CartItem[]) => {
     try {
        await updateOrderAPI(orderId, { action: 'addItems', items: itemsToAdd });
        const itemNames = itemsToAdd.map(i => `${i.quantity}x ${i.name}`).join(', ');
        logActivity(`Added items to Order #${orderId.slice(-6)}: ${itemNames}.`, user?.username || 'System', 'Order');
        toast({ title: 'Items Added', description: 'The order has been updated successfully.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    }
  }, [updateOrderAPI, logActivity, toast, user]);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus, reason?: string) => {
    try {
        await updateOrderAPI(orderId, { action: 'updateStatus', status, reason });
        if (status === 'Completed' && user) {
            const order = (orders || []).find(o => o.id === orderId);
            if (order) updateUserBalance(user.id, order.totalAmount, 'add');
        }
        logActivity(`Updated Order #${orderId.slice(-6)} status to '${status}'.`, user?.username || 'System', 'Order');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Status Update Failed', description: error.message });
    }
  }, [updateOrderAPI, orders, logActivity, toast, user, updateUserBalance]);
  
  const toggleItemPrepared = useCallback(async (orderId: string, itemIds: string[]) => {
     try {
        await updateOrderAPI(orderId, { action: 'togglePrepared', itemIds });
        // Log is now handled server-side
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    }
  }, [updateOrderAPI, toast]);
  
  const dispatchItem = useCallback(async (orderId: string, itemId: string) => {
    try {
        await updateOrderAPI(orderId, { action: 'dispatchItem', itemId });
        // Log is now handled server-side
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    }
  }, [updateOrderAPI, toast]);

  const applyDiscountOrComplementary = useCallback(async (orderId: string, details: any) => {
    try {
        await updateOrderAPI(orderId, { action: 'applyAdjustment', details });
        logActivity(`Applied adjustment to Order #${orderId.slice(-6)}.`, user?.username || 'System', 'Order');
        toast({ title: 'Order Modified', description: 'The adjustment has been applied.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Modification Failed', description: error.message });
    }
  }, [updateOrderAPI, logActivity, toast, user]);

  const changePaymentMethod = useCallback(async (orderId: string, newPaymentMethod: string) => {
    try {
        await updateOrderAPI(orderId, { action: 'changePayment', paymentMethod: newPaymentMethod });
        logActivity(`Changed payment method for Order #${orderId.slice(-6)} to '${newPaymentMethod}'.`, user?.username || 'System', 'Order');
        toast({ title: 'Payment Method Updated' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    }
  }, [updateOrderAPI, logActivity, toast, user]);

  const clearOrders = useCallback(() => {
    // This is a destructive action, typically not exposed to the client.
    // If needed, a secure API endpoint would handle this.
    console.warn("Clearing all orders from the client is not a standard operation.");
  }, []);

  return (
    <OrderContext.Provider value={{ orders: orders || [], isLoading, addOrder, addItemsToOrder, updateOrderStatus, toggleItemPrepared, dispatchItem, applyDiscountOrComplementary, changePaymentMethod, clearOrders, occupiedTableIds }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
