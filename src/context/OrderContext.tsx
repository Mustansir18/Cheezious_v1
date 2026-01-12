
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Order, OrderStatus, OrderItem, CartItem } from '@/lib/types';
import { useActivityLog } from './ActivityLogContext';
import { useAuth } from './AuthContext';
import { useMenu } from './MenuContext';
import { useSettings } from './SettingsContext';
import { useToast } from '@/hooks/use-toast';

interface OrderContextType {
  orders: Order[];
  isLoading: boolean;
  addOrder: (order: Order) => void;
  addItemsToOrder: (orderId: string, itemsToAdd: CartItem[]) => void;
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
  changePaymentMethod: (orderId: string, newPaymentMethod: string) => void;
  clearOrders: () => void;
  occupiedTableIds: Set<string>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

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
  const { user, updateUserBalance } = useAuth();
  const { menu } = useMenu();
  const { settings } = useSettings();
  const { toast } = useToast();
  const prevOrders = usePrevious(orders);

  const occupiedTableIds = useMemo(() => {
    const ids = orders
        .filter(o => o.orderType === 'Dine-In' && o.tableId && ['Pending', 'Preparing', 'Ready', 'Partial Ready'].includes(o.status))
        .map(o => o.tableId!);
    return new Set(ids);
  }, [orders]);


  useEffect(() => {
    async function loadInitialOrders() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        setOrders(data.orders || []);
      } catch (error) {
        console.error("Could not load orders from API", error);
        toast({
          variant: 'destructive',
          title: 'Failed to Load Orders',
          description: 'Could not connect to the server. Some data may be missing.',
        });
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialOrders();
  }, [toast]);
  
  useEffect(() => {
    if (!prevOrders || isLoading || !user) return;
    const username = user?.username || 'System';

    if (orders.length > prevOrders.length) {
        const newOrder = orders.find(o => !prevOrders.some(po => po.id === o.id));
        if (newOrder) {
            logActivity(`Placed new Order #${newOrder.orderNumber}.`, username, 'Order');
        }
    }

    orders.forEach(currentOrder => {
      const oldOrder = prevOrders.find(o => o.id === currentOrder.id);
      if (oldOrder) {
        if (oldOrder.status !== currentOrder.status) {
          if (currentOrder.status === 'Cancelled') {
              logActivity(`Cancelled Order #${currentOrder.orderNumber}. Reason: ${currentOrder.cancellationReason}`, username, 'Order');
          } else {
              logActivity(`Updated Order #${currentOrder.orderNumber} status from '${oldOrder.status}' to '${currentOrder.status}'.`, username, 'Order');
          }
           // When an order is completed, update the cashier's balance
          if (currentOrder.status === 'Completed' && user) {
            updateUserBalance(user.id, currentOrder.totalAmount, 'add');
          }
        }
        
        if (currentOrder.items.length > oldOrder.items.length) {
            const newItems = currentOrder.items.slice(oldOrder.items.length);
            const itemNames = newItems.map(i => `${i.quantity}x ${i.name}`).join(', ');
            logActivity(`Added items to Order #${currentOrder.orderNumber}: ${itemNames}.`, username, 'Order');
        }

        if (oldOrder.discountAmount !== currentOrder.discountAmount && currentOrder.discountAmount) {
             logActivity(`Applied ${currentOrder.discountType} discount of ${currentOrder.discountValue} to Order #${currentOrder.orderNumber}.`, username, 'Order');
        }

        if (!oldOrder.isComplementary && currentOrder.isComplementary) {
            logActivity(`Marked Order #${currentOrder.orderNumber} as complementary. Reason: ${currentOrder.complementaryReason}.`, username, 'Order');
        }

        if (oldOrder.paymentMethod !== currentOrder.paymentMethod) {
            logActivity(`Changed payment method for Order #${currentOrder.orderNumber} to '${currentOrder.paymentMethod}'.`, username, 'Order');
        }

        currentOrder.items.forEach(currentItem => {
            const oldItem = oldOrder.items.find(i => i.id === currentItem.id);
            if (oldItem && !oldItem.isPrepared && currentItem.isPrepared) {
                 logActivity(`Marked item '${currentItem.name}' as prepared for order #${currentOrder.orderNumber}.`, username, 'Order');
            }
        });
      }
    });
  }, [orders, prevOrders, logActivity, user, isLoading, updateUserBalance]);


  const addOrder = useCallback(async (order: Order) => {
    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save order to the database.');
        }

        const savedOrder = await response.json();
        setOrders((prevOrders) => [...prevOrders, savedOrder]);
    } catch (error: any) {
        console.error("Failed to add order:", error);
        toast({
            variant: 'destructive',
            title: 'Order Failed',
            description: `Could not save the order to the database. Please try again. Error: ${error.message}`,
        });
    }
  }, [toast]);

  const addItemsToOrder = useCallback(async (orderId: string, itemsToAdd: CartItem[]) => {
    // This function will need a PUT /api/orders/:id/items endpoint
    console.log("Simulating adding items to order. API call not yet implemented.");

    setOrders(prevOrders => {
        return prevOrders.map(order => {
            if (order.id !== orderId) return order;

            const newOrderItems: OrderItem[] = [];
            itemsToAdd.forEach(item => {
                const menuItem = menu.items.find(mi => mi.id === item.id);
                if (!menuItem) return;

                const category = menu.categories.find(c => c.id === menuItem.categoryId);
                const isDeal = menuItem.dealItems && menuItem.dealItems.length > 0;
                const parentOrderItemId = crypto.randomUUID();

                newOrderItems.push({
                    id: parentOrderItemId, orderId: orderId, menuItemId: item.id, name: item.name, quantity: item.quantity, itemPrice: item.price, baseItemPrice: item.basePrice,
                    selectedAddons: item.selectedAddons.map(a => ({ name: a.name, price: a.price, quantity: a.quantity })),
                    selectedVariant: item.selectedVariant, stationId: category?.stationId, isPrepared: !category?.stationId, instructions: item.instructions,
                    isDealComponent: false, parentDealCartItemId: parentOrderItemId,
                });

                if (isDeal) {
                    menuItem.dealItems?.forEach(dealItemDef => {
                        const componentMenuItem = menu.items.find(i => i.id === dealItemDef.menuItemId);
                        if(componentMenuItem) {
                            const componentCategory = menu.categories.find(c => c.id === componentMenuItem.categoryId);
                            for (let i = 0; i < dealItemDef.quantity * item.quantity; i++) {
                                newOrderItems.push({
                                    id: crypto.randomUUID(), orderId: orderId, menuItemId: componentMenuItem.id, name: componentMenuItem.name, quantity: 1,
                                    itemPrice: 0, baseItemPrice: 0, selectedAddons: [], isDealComponent: true, parentDealCartItemId: parentOrderItemId,
                                    stationId: componentCategory?.stationId, isPrepared: !componentCategory?.stationId
                                });
                            }
                        }
                    });
                }
            });

            const newItemsTotal = newOrderItems.filter(i => !i.isDealComponent).reduce((sum, item) => sum + (item.itemPrice * item.quantity), 0);
            const updatedItems = [...order.items, ...newOrderItems];
            const updatedSubtotal = order.subtotal + newItemsTotal;
            const updatedTaxAmount = updatedSubtotal * order.taxRate;
            const updatedTotalAmount = updatedSubtotal + updatedTaxAmount;
            
            const newStatus = (order.status === 'Ready' || order.status === 'Completed') ? 'Partial Ready' : order.status;

            return {
                ...order, items: updatedItems, subtotal: updatedSubtotal, taxAmount: updatedTaxAmount, totalAmount: updatedTotalAmount,
                originalTotalAmount: order.originalTotalAmount ? order.originalTotalAmount + newItemsTotal : updatedTotalAmount,
                status: newStatus, completionDate: newStatus === 'Partial Ready' ? undefined : order.completionDate,
            };
        });
    });
  }, [menu.items, menu.categories]);


  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus, reason?: string) => {
    // This function will need a PUT /api/orders/:id endpoint
    console.log("Simulating order status update. API call not yet implemented.");

    setOrders(prevOrders => {
        const orderToUpdate = prevOrders.find(o => o.id === orderId);
        if (!orderToUpdate || orderToUpdate.status === status) return prevOrders;

        return prevOrders.map(order => {
            if (order.id !== orderId) return order;

            const isFinalStatus = status === 'Completed' || status === 'Cancelled';
            const newCompletionDate = isFinalStatus ? (order.completionDate || new Date().toISOString()) : undefined;

            return { 
                ...order, status, completionDate: newCompletionDate,
                ...(status === 'Completed' && { completedBy: user?.id }),
                ...(status === 'Cancelled' && { cancellationReason: reason }) 
            };
        });
    });
  }, [user]);
  
 const toggleItemPrepared = useCallback((orderId: string, itemIds: string[]) => {
    // This function will need a PUT /api/orders/:id/items endpoint
    console.log("Simulating item prepared toggle. API call not yet implemented.");

    setOrders(prevOrders => {
      return prevOrders.map(order => {
        if (order.id === orderId) {
          const newItems = order.items.map(item => {
            if (itemIds.includes(item.id)) {
              const wasPrepared = item.isPrepared;
              return { ...item, isPrepared: !wasPrepared, preparedAt: !wasPrepared ? new Date().toISOString() : item.preparedAt };
            }
            return item;
          });

          return { ...order, items: newItems };
        }
        return order;
      });
    });
  }, []);
  
  const dispatchItem = useCallback((orderId: string, itemId: string) => {
    // This function will need a PUT /api/orders/:id/items endpoint
    console.log("Simulating item dispatch. API call not yet implemented.");

    setOrders(prevOrders => prevOrders.map(order => {
      if (order.id === orderId) {
        const newItems = order.items.map(item => 
          item.id === itemId ? { ...item, isDispatched: true } : item
        );
        
        const allPhysicalItems = newItems.filter(item => {
             const menuItem = menu.items.find(mi => mi.id === item.menuItemId);
             const isDealContainer = !item.isDealComponent && !!menuItem?.dealItems?.length;
             return !isDealContainer;
        });
        
        const allDispatched = allPhysicalItems.every(item => item.isDispatched);
        const newStatus = allDispatched ? 'Ready' : 'Partial Ready';
        
        return { ...order, items: newItems, status: newStatus };
      }
      return order;
    }));
  }, [menu.items]);


   const applyDiscountOrComplementary = useCallback((orderId: string, details: { discountType?: 'percentage' | 'amount', discountValue?: number, isComplementary?: boolean, complementaryReason?: string }) => {
    // This function will need a PUT /api/orders/:id/adjust endpoint
    console.log("Simulating order modification. API call not yet implemented.");

    setOrders(prevOrders => {
      const orderToUpdate = prevOrders.find(o => o.id === orderId);
      if (!orderToUpdate) return prevOrders;

      let updatedOrder = { ...orderToUpdate };
      const originalTotal = orderToUpdate.originalTotalAmount ?? orderToUpdate.totalAmount;

      if (details.isComplementary) {
        updatedOrder = {
          ...updatedOrder, isComplementary: true, complementaryReason: details.complementaryReason, totalAmount: 0,
          discountAmount: originalTotal, originalTotalAmount: originalTotal, discountType: undefined, discountValue: undefined,
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
          ...updatedOrder, discountType: details.discountType, discountValue: details.discountValue, discountAmount: discountAmount,
          totalAmount: newTotalAmount, originalTotalAmount: originalTotal, isComplementary: false, complementaryReason: undefined,
        };
      }
      return prevOrders.map(o => o.id === orderId ? updatedOrder : o);
    });
  }, []);

  const changePaymentMethod = useCallback((orderId: string, newPaymentMethod: string) => {
    // This function will need a PUT /api/orders/:id/payment endpoint
    console.log("Simulating payment method change. API call not yet implemented.");

    setOrders(prevOrders => prevOrders.map(order => {
        if (order.id !== orderId) return order;

        const paymentMethodDetails = settings.paymentMethods.find(pm => pm.name === newPaymentMethod);
        const newTaxRate = paymentMethodDetails?.taxRate ?? 0;
        
        const newTaxAmount = order.subtotal * newTaxRate;
        const totalBeforeDiscount = order.subtotal + newTaxAmount;
        const newTotalAmount = Math.max(0, totalBeforeDiscount - (order.discountAmount || 0));
        
        return {
            ...order, paymentMethod: newPaymentMethod, taxRate: newTaxRate, taxAmount: newTaxAmount, totalAmount: newTotalAmount,
        };
    }));
  }, [settings.paymentMethods]);


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
        addItemsToOrder,
        updateOrderStatus,
        toggleItemPrepared,
        dispatchItem,
        applyDiscountOrComplementary,
        changePaymentMethod,
        clearOrders,
        occupiedTableIds,
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
