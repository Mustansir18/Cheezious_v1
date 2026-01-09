

"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import type { CartItem, MenuItem, OrderType, Addon, Deal, MenuItemVariant } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useMenu } from './MenuContext';


interface AddToCartOptions {
    item: MenuItem;
    selectedAddons?: { addon: Addon; quantity: number }[];
    itemQuantity: number;
    instructions: string;
    selectedVariant?: MenuItemVariant;
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
  updateQuantity: (cartItemId: string, change: number) => void;
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

  const addItem = ({ item: itemToAdd, selectedAddons = [], itemQuantity, instructions, selectedVariant }: AddToCartOptions) => {
    const isDeal = itemToAdd.categoryId === 'C-00001';

    // Generate a consistent ID for the item variation based on addons and instructions
    const getVariationId = (addons: { addon: Addon; quantity: number }[], instr: string, variant?: MenuItemVariant) => {
      const addonString = addons.length > 0 
        ? addons.map(a => `${a.addon.id}x${a.quantity}`).sort().join(',')
        : 'no-addons';
      const instructionString = instr.trim().toLowerCase();
      const variantString = variant ? variant.name : 'no-variant';
      return `${variantString}|${addonString}|${instructionString}`;
    };
    
    const variationId = getVariationId(selectedAddons, instructions, selectedVariant);

    const existingItem = items.find(
      (item) => item.id === itemToAdd.id && item.uniqueVariationId === variationId
    );

    if (existingItem) {
      updateQuantity(existingItem.cartItemId, itemQuantity);
    } else {
      const newItems: CartItem[] = [];
      const parentDealId = crypto.randomUUID();

      const addonPrice = selectedAddons.reduce((sum, { addon, quantity }) => sum + (addon.price * quantity), 0);
      const basePrice = isDeal ? itemToAdd.price : (selectedVariant ? selectedVariant.price : itemToAdd.price);
      const finalPrice = basePrice + addonPrice;

      const newCartItem: CartItem = {
        ...itemToAdd,
        cartItemId: parentDealId,
        uniqueVariationId: variationId,
        price: finalPrice,
        basePrice: basePrice,
        selectedAddons: selectedAddons.map(({ addon, quantity }) => ({ ...addon, quantity })),
        selectedVariant: selectedVariant,
        quantity: itemQuantity,
        instructions: instructions.trim() || undefined,
        isDealComponent: false,
      };
      newItems.push(newCartItem);

      if (isDeal && itemToAdd.dealItems) {
        for (const dealItem of itemToAdd.dealItems) {
          const componentItem = menu.items.find(i => i.id === dealItem.menuItemId);
          if (componentItem) {
            for (let i = 0; i < dealItem.quantity; i++) {
              newItems.push({
                ...componentItem,
                cartItemId: crypto.randomUUID(),
                quantity: 1, // Each component is added individually
                price: 0, // Deal components have no individual price
                basePrice: 0,
                selectedAddons: [],
                isDealComponent: true,
                parentDealId: parentDealId,
              });
            }
          }
        }
      }
      setItems((prevItems) => [...prevItems, ...newItems]);
    }

    toast({
        title: "Added to Cart",
        description: `${itemQuantity}x ${itemToAdd.name} ${selectedVariant ? `(${selectedVariant.name})` : ''} is now in your order.`,
    });
  };


  const updateQuantity = (cartItemId: string, change: number) => {
    setItems((prevItems) => {
      const itemToUpdate = prevItems.find(item => item.cartItemId === cartItemId);
      
      if (!itemToUpdate) return prevItems;

      const newQuantity = itemToUpdate.quantity + change;

      if (newQuantity <= 0) {
        // Filter out the item itself and any components that belong to it if it's a deal
        if (itemToUpdate.categoryId === 'C-00001') {
            return prevItems.filter(i => i.cartItemId !== cartItemId && i.parentDealId !== cartItemId);
        }
        return prevItems.filter((item) => item.cartItemId !== cartItemId);
      }

      return prevItems.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
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
        if (!item.isDealComponent) {
            return total + item.price * item.quantity;
        }
        return total;
    }, 0);
  }, [items]);

  const cartCount = useMemo(() => {
    return items.filter(item => !item.isDealComponent).reduce((count, item) => count + item.quantity, 0);
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
