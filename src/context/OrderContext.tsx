
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Order, OrderStatus } from '@/lib/types';
import { useActivityLog } from './ActivityLogContext';
import { useAuth } from './AuthContext';

interface OrderContextType {
  orders: Order[];
  isLoading: boolean;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, reason?: string) => void;
  clearOrders: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Define a key for sessionStorage
const ORDERS_STORAGE_KEY = 'cheeziousOrders';

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { logActivity } = useActivityLog();
  const { user } = useAuth();

  // Load orders from sessionStorage on initial render
  useEffect(() => {
    try {
      const storedOrders = sessionStorage.getItem(ORDERS_STORAGE_KEY);
      if (storedOrders) {
        setOrders(JSON.parse(storedOrders));
      }
    } catch (error) {
      console.error("Could not load orders from session storage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Persist orders to sessionStorage whenever they change
  useEffect(() => {
    try {
      // Only persist if loading is complete to avoid overwriting initial state
      if (!isLoading) {
        sessionStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
      }
    } catch (error) {
      console.error("Could not save orders to session storage", error);
    }
  }, [orders, isLoading]);
  
  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === ORDERS_STORAGE_KEY && event.newValue) {
        try {
          setOrders(JSON.parse(event.newValue));
        } catch (error) {
            console.error("Failed to parse orders from storage event", error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  const addOrder = useCallback((order: Order) => {
    setOrders((prevOrders) => [...prevOrders, order]);
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus, reason?: string) => {
    setOrders((prevOrders) => {
        const orderToUpdate = prevOrders.find(o => o.id === orderId);
        if (!orderToUpdate) return prevOrders;

        const updatedOrder = { 
            ...orderToUpdate, 
            status, 
            ...(status === 'Cancelled' && { cancellationReason: reason }) 
        };

        if (status === 'Cancelled') {
            logActivity(`Cancelled Order #${orderToUpdate.orderNumber}. Reason: ${reason}`, user?.username || 'System');
        } else {
            logActivity(`Updated Order #${orderToUpdate.orderNumber} status to '${status}'.`, user?.username || 'System');
        }

        return prevOrders.map(order => order.id === orderId ? updatedOrder : order);
    });
  }, [logActivity, user]);

  const clearOrders = useCallback(() => {
    setOrders([]);
    logActivity('Cleared all orders for the current session.', user?.username || 'System');
  }, [logActivity, user]);

  return (
    <OrderContext.Provider
      value={{
        orders,
        isLoading,
        addOrder,
        updateOrderStatus,
        clearOrders,
      }}
    >
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
