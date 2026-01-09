

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
  toggleItemPrepared: (orderId: string, itemIds: string[]) => void;
  dispatchItem: (orderId: string, itemId: string) => void;
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

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
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

  // Log activities when order status or item preparation status changes
  useEffect(() => {
    if (!prevOrders || isLoading) return;
    const username = user?.username || 'System';

    orders.forEach(currentOrder => {
      const oldOrder = prevOrders.find(o => o.id === currentOrder.id);
      if (oldOrder) {
        // Log main order status change
        if (oldOrder.status !== currentOrder.status) {
          if (currentOrder.status === 'Cancelled') {
              logActivity(`Cancelled Order #${currentOrder.orderNumber}. Reason: ${currentOrder.cancellationReason}`, username, 'Order');
          } else {
              logActivity(`Updated Order #${currentOrder.orderNumber} status from '${oldOrder.status}' to '${currentOrder.status}'.`, username, 'Order');
          }
        }
        
        // Log item preparation status changes
        currentOrder.items.forEach(currentItem => {
            const oldItem = oldOrder.items.find(i => i.id === currentItem.id);
            if (oldItem && !oldItem.isPrepared && currentItem.isPrepared) {
                 logActivity(`Marked item '${currentItem.name}' as prepared for order #${currentOrder.orderNumber}.`, username, 'Order');
            }
        });
      }
    });
  }, [orders, prevOrders, logActivity, user, isLoading]);


  const addOrder = useCallback((order: Order) => {
    setOrders((prevOrders) => [...prevOrders, order]);
    logActivity(`Placed new Order #${order.orderNumber}.`, user?.username || 'System', 'Order');
  }, [logActivity, user]);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus, reason?: string) => {
    setOrders(prevOrders => {
        const orderToUpdate = prevOrders.find(o => o.id === orderId);
        if (!orderToUpdate || orderToUpdate.status === status) return prevOrders;

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
  }, []);
  
 const toggleItemPrepared = useCallback((orderId: string, itemIds: string[]) => {
    setOrders(prevOrders => {
      return prevOrders.map(order => {
        if (order.id === orderId) {
          const newItems = order.items.map(item => {
            if (itemIds.includes(item.id)) {
              const wasPrepared = item.isPrepared;
              // Toggle and add timestamp if it's being marked as prepared
              return { ...item, isPrepared: !wasPrepared, preparedAt: !wasPrepared ? new Date().toISOString() : item.preparedAt };
            }
            return item;
          });

          // The status is determined by the station and assembly process,
          // so we don't automatically change the order status here anymore.
          // The CUTT station will determine the final 'Ready' status.

          return { ...order, items: newItems };
        }
        return order;
      });
    });
  }, []);
  
  const dispatchItem = useCallback((orderId: string, itemId: string) => {
    setOrders(prevOrders => prevOrders.map(order => {
      if (order.id === orderId) {
        const newItems = order.items.map(item => 
          item.id === itemId ? { ...item, isDispatched: true } : item
        );
        
        // An item is considered "fulfilled" if it is dispatched OR if it was dispatch-only to begin with.
        const allItemsFulfilled = newItems.every(item => item.isDispatched || !item.stationId);
        const newStatus = allItemsFulfilled ? 'Ready' : 'Partial Ready';
        
        return { ...order, items: newItems, status: newStatus };
      }
      return order;
    }));
  }, []);


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
        dispatchItem,
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
