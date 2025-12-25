
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import type { Order, OrderStatus } from '@/lib/types';
import { useActivityLog } from './ActivityLogContext';
import { useAuth } from './AuthContext';

interface OrderContextType {
  orders: Order[];
  isLoading: boolean;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, reason?: string) => void;
  applyDiscountOrComplementary: (
    orderId: string, 
    details: { 
        discountType?: 'percentage' | 'amount', 
        discountValue?: number, 
        isComplementary?: boolean,
        complementaryReason?: string 
    }) => void;
  clearOrders: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Define a key for sessionStorage
const ORDERS_STORAGE_KEY = 'cheeziousOrders';

function usePrevious<T>(value: T) {
    const ref = React.useRef<T>();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}


export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { logActivity } = useActivityLog();
  const { user } = useAuth();
  const prevOrders = usePrevious(orders);


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

  // Effect for logging activities
   useEffect(() => {
    if (isLoading || !prevOrders) return;
    const username = user?.username || 'System';

    if (orders.length > prevOrders.length) {
        const newOrder = orders.find(o => !prevOrders.some(po => po.id === o.id));
        if (newOrder) {
             logActivity(`Placed new Order #${newOrder.orderNumber}.`, username);
        }
    } else if (orders.length === 0 && prevOrders.length > 0) {
        logActivity('Cleared all orders for the current session.', username);
    } else {
        // Check for status updates, cancellations, or modifications
        orders.forEach(currentOrder => {
            const oldOrder = prevOrders.find(po => po.id === currentOrder.id);
            if (oldOrder && JSON.stringify(oldOrder) !== JSON.stringify(currentOrder)) {
                 if (oldOrder.status !== currentOrder.status) {
                    if (currentOrder.status === 'Cancelled') {
                        logActivity(`Cancelled Order #${currentOrder.orderNumber}. Reason: ${currentOrder.cancellationReason}`, username);
                    } else {
                        logActivity(`Updated Order #${currentOrder.orderNumber} status to '${currentOrder.status}'.`, username);
                    }
                } else if (!oldOrder.isComplementary && currentOrder.isComplementary) {
                     logActivity(`Order #${currentOrder.orderNumber} marked as complementary. Reason: ${currentOrder.complementaryReason}.`, username);
                } else if (oldOrder.discountAmount !== currentOrder.discountAmount) {
                     logActivity(`Applied ${currentOrder.discountType} discount of ${currentOrder.discountValue} to Order #${currentOrder.orderNumber}.`, username);
                }
            }
        });
    }

  }, [orders, prevOrders, isLoading, logActivity, user?.username]);


  const addOrder = useCallback((order: Order) => {
    setOrders((prevOrders) => [...prevOrders, order]);
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus, reason?: string) => {
    setOrders((prevOrders) => {
        return prevOrders.map(order => 
            order.id === orderId 
            ? { 
                ...order, 
                status, 
                ...(status === 'Cancelled' && { cancellationReason: reason }) 
              }
            : order
        );
    });
  }, []);


   const applyDiscountOrComplementary = useCallback((orderId: string, details: { discountType?: 'percentage' | 'amount', discountValue?: number, isComplementary?: boolean, complementaryReason?: string }) => {
    setOrders(prevOrders => {
      const orderToUpdate = prevOrders.find(o => o.id === orderId);
      if (!orderToUpdate) return prevOrders;

      let updatedOrder = { ...orderToUpdate };
      const originalTotal = orderToUpdate.originalTotalAmount ?? orderToUpdate.totalAmount;

      if (details.isComplementary) {
        updatedOrder = {
          ...updatedOrder,
          isComplementary: true,
          complementaryReason: details.complementaryReason,
          totalAmount: 0,
          discountAmount: originalTotal,
          originalTotalAmount: originalTotal,
          discountType: undefined,
          discountValue: undefined,
        };
      } else if (details.discountType && details.discountValue) {
        let discountAmount = 0;
        if (details.discountType === 'percentage') {
          discountAmount = originalTotal * (details.discountValue / 100);
        } else {
          discountAmount = details.discountValue;
        }

        const newTotalAmount = Math.max(0, originalTotal - discountAmount);

        updatedOrder = {
          ...updatedOrder,
          discountType: details.discountType,
          discountValue: details.discountValue,
          discountAmount: discountAmount,
          totalAmount: newTotalAmount,
          originalTotalAmount: originalTotal,
          isComplementary: false,
          complementaryReason: undefined,
        };
      }

      return prevOrders.map(o => o.id === orderId ? updatedOrder : o);
    });
  }, []);

  const clearOrders = useCallback(() => {
    setOrders([]);
  }, []);

  return (
    <OrderContext.Provider
      value={{
        orders,
        isLoading,
        addOrder,
        updateOrderStatus,
        applyDiscountOrComplementary,
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
