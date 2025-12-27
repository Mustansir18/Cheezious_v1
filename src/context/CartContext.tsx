
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { CartItem, MenuItem, OrderType, Addon } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


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

    const addonIds = selectedAddons.map(({ addon, quantity }) => `${addon.id}x${quantity}`).sort().join('-');
    const cartItemId = `${itemToAdd.id}${addonIds ? `-${addonIds}` : ''}`;
    
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.cartItemId === cartItemId);

      if (existingItem) {
        return prevItems.map((item) =>
          item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + itemQuantity } : item
        );
      }
      
      const newCartItem: CartItem = { 
        ...itemToAdd,
        cartItemId: cartItemId,
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

  const updateQuantity = (cartItemId: string, quantity: number) => {
    setItems((prevItems) => {
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

  const cartCount = items.reduce((count, item) => count + item.quantity, 0);
  const cartTotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

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
