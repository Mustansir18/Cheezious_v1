

"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import type { CartItem, MenuItem, OrderType, Addon, Deal, DealItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useMenu } from './MenuContext';


interface AddToCartOptions {
    item: MenuItem;
    selectedAddons?: { addon: Addon; quantity: number }[];
    itemQuantity: number;
}
interface CartContextType {
  items: CartItem[];
  branchId: string | null;
  orderType: OrderType | null;
  tableId: string | null;
  floorId: string | null;
  isCartOpen: boolean;
  setIsCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
  addItem: (options: AddToCartOptions) => void;
  addDeal: (deal: Deal) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  closeCart: () => void;
  setOrderDetails: (details: { branchId: string; orderType: OrderType; }) => void;
  setTable: (tableId: string, floorId: string) => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [tableId, setTableId] = useState<string | null>(null);
  const [floorId, setFloorId] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();
  const { menu } = useMenu();

  useEffect(() => {
    try {
      const storedCart = sessionStorage.getItem('cheeziousCart');
      if (storedCart) {
        const { items, branchId, orderType, floorId, tableId } = JSON.parse(storedCart);
        setItems(items || []);
        setBranchId(branchId || null);
        setOrderType(orderType || null);
        setFloorId(floorId || null);
        setTableId(tableId || null);
      }
    } catch (error) {
      console.error("Could not load cart from session storage", error);
    }
  }, []);

  useEffect(() => {
    try {
      const cartState = JSON.stringify({ items, branchId, orderType, floorId, tableId });
      sessionStorage.setItem('cheeziousCart', cartState);
    } catch (error) {
      console.error("Could not save cart to session storage", error);
    }
  }, [items, branchId, orderType, floorId, tableId]);

  const setOrderDetails = (details: { branchId: string; orderType: OrderType; }) => {
    const hasChanged = details.branchId !== branchId || details.orderType !== orderType;
    
    setBranchId(details.branchId);
    setOrderType(details.orderType);

    if (details.orderType === 'Dine-In') {
        // Don't set table here, it will be set by `setTable`
    } else {
        setFloorId(null);
        setTableId(null);
    }
    
    if (hasChanged) {
      setItems([]);
    }
  };

  const setTable = (newTableId: string, newFloorId: string) => {
    setTableId(newTableId);
    setFloorId(newFloorId);
  }

  const addItem = ({ item: itemToAdd, selectedAddons = [], itemQuantity }: AddToCartOptions) => {
    const addonPrice = selectedAddons.reduce((sum, { addon, quantity }) => sum + (addon.price * quantity), 0);
    const finalPrice = itemToAdd.price + addonPrice;

    // Create a unique key for an item based on its ID and its specific addon combination.
    const addonCombinationKey = selectedAddons
      .map(({ addon, quantity }) => `${addon.id}x${quantity}`)
      .sort()
      .join('-');
      
    const cartItemId = `${itemToAdd.id}${addonCombinationKey ? `-${addonCombinationKey}` : ''}`;
    
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.cartItemId === cartItemId);

      if (existingItem) {
        // If the exact item with the same addons exists, just increase its quantity.
        return prevItems.map((item) =>
          item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + itemQuantity } : item
        );
      }
      
      // If it's a new item or a new combination of addons, add it as a new line item.
      const newCartItem: CartItem = { 
        ...itemToAdd,
        cartItemId: `${cartItemId}-${crypto.randomUUID()}`, // Ensure unique even if added twice quickly
        price: finalPrice,
        basePrice: itemToAdd.price,
        selectedAddons: selectedAddons.map(({ addon, quantity }) => ({ ...addon, quantity })),
        quantity: itemQuantity,
      };
      return [...prevItems, newCartItem];
    });

    toast({
        title: "Added to Cart",
        description: `${itemQuantity}x ${itemToAdd.name} is now in your order.`,
    });
  };

  const addDeal = (deal: Deal) => {
    const dealCartId = `deal-${deal.id}-${crypto.randomUUID()}`;
    const dealMenuItem = menu.items.find(i => i.id === deal.id);
    if (!dealMenuItem) return; // Should not happen

    // The deal itself is the parent item. It holds the total price.
    const dealCartItem: CartItem = {
      ...dealMenuItem,
      cartItemId: dealCartId, 
      price: deal.price,
      basePrice: deal.price,
      quantity: 1,
      selectedAddons: [],
      isDealComponent: false, // This is the main deal item, not a component.
    };

    // The component items are added with a price of 0.
    const componentItems: CartItem[] = deal.items.flatMap((dealComponent: DealItem) => {
      const menuItem = menu.items.find(i => i.id === dealComponent.menuItemId);
      if (!menuItem) return [];

      return {
        ...menuItem,
        cartItemId: `${menuItem.id}-${crypto.randomUUID()}`,
        price: 0, 
        basePrice: menuItem.price,
        quantity: dealComponent.quantity,
        selectedAddons: [],
        isDealComponent: true, 
        parentDealId: dealCartId, // Link back to the parent deal item.
      };
    });

    setItems(prev => [...prev, dealCartItem, ...componentItems]);

    toast({
      title: "Deal Added!",
      description: `The "${deal.name}" deal has been added to your cart.`,
    });
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    setItems((prevItems) => {
      const itemToUpdate = prevItems.find(item => item.cartItemId === cartItemId);
      
      if (!itemToUpdate) return prevItems;

      // If the item is a Deal (the parent), we must remove its components as well.
      if (itemToUpdate.categoryId === 'deals' && !itemToUpdate.isDealComponent) {
          if (quantity <= 0) {
              // Remove the deal and all its child components
              return prevItems.filter(item => item.cartItemId !== cartItemId && item.parentDealId !== cartItemId);
          }
          // For now, we don't support increasing quantity of a deal directly. 
          toast({
              title: "Cannot change deal quantity",
              description: "Please remove the deal and add it again."
          });
          return prevItems;
      }

      // If the item is a component of a deal, prevent modification.
      if (itemToUpdate.isDealComponent) {
          toast({
              variant: 'destructive',
              title: 'Cannot Modify Deal Item',
              description: 'Please remove the entire deal to change items.'
          });
          return prevItems;
      }
      
      // For regular items
      if (quantity <= 0) {
        return prevItems.filter((item) => item.cartItemId !== cartItemId);
      }
      return prevItems.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity } : item
      );
    });
  };


  const clearCart = () => {
    setItems([]);
    setTableId(null);
    setFloorId(null);
  };
  
  const closeCart = () => {
    setIsCartOpen(false);
  }

  const cartTotal = useMemo(() => {
    return items.reduce((total, item) => {
        // The price for deal components is 0, so this calculation works correctly.
        // The total price is held by the main deal item.
        return total + item.price * item.quantity;
    }, 0);
  }, [items]);

  const cartCount = useMemo(() => {
    // We only count top-level items (regular items and deals), not deal components.
    return items.reduce((count, item) => {
        if (item.isDealComponent) return count; 
        return count + item.quantity;
    }, 0);
  }, [items]);


  return (
    <CartContext.Provider
      value={{
        items,
        branchId,
        orderType,
        tableId,
        floorId,
        isCartOpen,
        setIsCartOpen,
        addItem,
        addDeal,
        updateQuantity,
        clearCart,
        closeCart,
        setOrderDetails,
        setTable,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
