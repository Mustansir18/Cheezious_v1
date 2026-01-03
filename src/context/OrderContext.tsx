
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import type { Order, OrderStatus, OrderItem } from '@/lib/types';
import { useActivityLog } from './ActivityLogContext';
import { useAuth } from './AuthContext';

interface OrderContextType {
  orders: Order[];
  isLoading: boolean;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, reason?: string) => void;
  toggleItemPrepared: (orderId: string, itemId: string) => void;
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
    logActivity(`Placed new Order #${order.orderNumber}.`, user?.username || 'System', 'Order');
  }, [logActivity, user]);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus, reason?: string) => {
    setOrders(prevOrders => {
        const orderToUpdate = prevOrders.find(o => o.id === orderId);
        if (!orderToUpdate || orderToUpdate.status === status) return prevOrders;

        if (status === 'Cancelled') {
            logActivity(`Cancelled Order #${orderToUpdate.orderNumber}. Reason: ${reason}`, user?.username || 'System', 'Order');
        } else {
            logActivity(`Updated Order #${orderToUpdate.orderNumber} status from '${orderToUpdate.status}' to '${status}'.`, user?.username || 'System', 'Order');
        }

        return prevOrders.map(order => {
            if (order.id !== orderId) return order;

            const isFinalStatus = status === 'Completed' || status === 'Cancelled';
            
            const newCompletionDate = isFinalStatus ? (order.completionDate || new Date().toISOString()) : undefined;

            return { 
                ...order, 
                status, 
                completionDate: newCompletionDate,
                ...(status === 'Cancelled' && { cancellationReason: reason }) 
            };
        });
    });
  }, [logActivity, user]);
  
  const toggleItemPrepared = useCallback((orderId: string, itemId: string) => {
      setOrders(prevOrders => {
          return prevOrders.map(order => {
              if (order.id === orderId) {
                  let allItemsPrepared = true;
                  const newItems = order.items.map(item => {
                      if (item.id === itemId) {
                          if (!item.isPrepared) {
                            logActivity(`Marked item '${item.name}' as prepared for order #${order.orderNumber}.`, user?.username || 'System', 'Order');
                          }
                          return { ...item, isPrepared: !item.isPrepared };
                      }
                      return item;
                  });

                  // After toggling, check if all items are now prepared
                  for (const item of newItems) {
                      if (!item.isPrepared) {
                          allItemsPrepared = false;
                          break;
                      }
                  }
                  
                  // If all items are prepared and status is 'Preparing', move to 'Ready'
                  if (allItemsPrepared && order.status === 'Preparing') {
                      logActivity(`All items ready for Order #${order.orderNumber}. Status moved to 'Ready'.`, user?.username || 'System', 'Order');
                      return { ...order, items: newItems, status: 'Ready' as OrderStatus };
                  }

                  return { ...order, items: newItems };
              }
              return order;
          });
      });
  }, [logActivity, user]);


   const applyDiscountOrComplementary = useCallback((orderId: string, details: { discountType?: 'percentage' | 'amount', discountValue?: number, isComplementary?: boolean, complementaryReason?: string }) => {
    setOrders(prevOrders => {
      const orderToUpdate = prevOrders.find(o => o.id === orderId);
      if (!orderToUpdate) return prevOrders;

      let updatedOrder = { ...orderToUpdate };
      const originalTotal = orderToUpdate.originalTotalAmount ?? orderToUpdate.totalAmount;
      const username = user?.username || 'System';

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
        logActivity(`Marked Order #${updatedOrder.orderNumber} as complementary. Reason: ${details.complementaryReason}.`, username, 'Order');
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
        logActivity(`Applied ${details.discountType} discount of ${details.discountValue} to Order #${updatedOrder.orderNumber}.`, username, 'Order');
      }

      return prevOrders.map(o => o.id === orderId ? updatedOrder : o);
    });
  }, [logActivity, user]);

  const clearOrders = useCallback(() => {
    setOrders([]);
    logActivity('Cleared all orders for the current session.', user?.username || 'System', 'System');
  }, [logActivity, user]);

  return (
    <OrderContext.Provider
      value={{
        orders,
        isLoading,
        addOrder,
        updateOrderStatus,
        toggleItemPrepared,
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

    
