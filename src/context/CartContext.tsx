

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import type { CartItem, MenuItem, OrderType, Addon, Deal, MenuItemVariant, SelectedAddon } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useMenu } from './MenuContext';


interface AddToCartOptions {
    item: MenuItem;
    selectedAddons?: SelectedAddon[];
    itemQuantity: number;
    instructions: string;
    selectedVariant?: MenuItemVariant;
}
interface CustomerDetails {
    name: string;
    phone: string;
    address: string;
}
interface CartContextType {
  items: CartItem[];
  branchId: string | null;
  orderType: OrderType | null;
  tableId: string | null;
  floorId: string | null;
  deliveryMode: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  isCartOpen: boolean;
  setIsCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
  addItem: (options: AddToCartOptions) => void;
  updateQuantity: (cartItemId: string, change: number) => void;
  clearCart: () => void;
  closeCart: () => void;
  setOrderDetails: (details: { branchId: string; orderType: OrderType; deliveryMode?: string }) => void;
  setCustomerDetails: (details: CustomerDetails) => void;
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
  const [deliveryMode, setDeliveryMode] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [customerPhone, setCustomerPhone] = useState<string | null>(null);
  const [customerAddress, setCustomerAddress] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();
  const { menu } = useMenu();

  useEffect(() => {
    try {
      const storedCart = sessionStorage.getItem('cheeziousCart');
      if (storedCart) {
        const { items, branchId, orderType, floorId, tableId, deliveryMode, customerName, customerPhone, customerAddress } = JSON.parse(storedCart);
        setItems(items || []);
        setBranchId(branchId || null);
        setOrderType(orderType || null);
        setFloorId(floorId || null);
        setTableId(tableId || null);
        setDeliveryMode(deliveryMode || null);
        setCustomerName(customerName || null);
        setCustomerPhone(customerPhone || null);
        setCustomerAddress(customerAddress || null);
      }
    } catch (error) {
      console.error("Could not load cart from session storage", error);
    }
  }, []);

  useEffect(() => {
    try {
      const cartState = JSON.stringify({ items, branchId, orderType, floorId, tableId, deliveryMode, customerName, customerPhone, customerAddress });
      sessionStorage.setItem('cheeziousCart', cartState);
    } catch (error) {
      console.error("Could not save cart to session storage", error);
    }
  }, [items, branchId, orderType, floorId, tableId, deliveryMode, customerName, customerPhone, customerAddress]);

  const setOrderDetails = useCallback((details: { branchId: string; orderType: OrderType; deliveryMode?: string; }) => {
    const hasChanged = details.branchId !== branchId || details.orderType !== orderType || details.deliveryMode !== deliveryMode;
    
    setBranchId(details.branchId);
    setOrderType(details.orderType);

    if (details.orderType === 'Delivery') {
        setDeliveryMode(details.deliveryMode || null);
        setFloorId(null);
        setTableId(null);
    } else if (details.orderType === 'Dine-In') {
        setDeliveryMode(null);
    } else { // Take-Away
        setFloorId(null);
        setTableId(null);
        setDeliveryMode(null);
    }
    
    if (hasChanged) {
      setItems([]);
      setCustomerName(null);
      setCustomerPhone(null);
      setCustomerAddress(null);
    }
  }, [branchId, orderType, deliveryMode]);

  const setCustomerDetails = useCallback((details: CustomerDetails) => {
    setCustomerName(details.name);
    setCustomerPhone(details.phone);
    setCustomerAddress(details.address);
  }, []);


  const setTable = useCallback((newTableId: string, newFloorId: string) => {
    setTableId(newTableId);
    setFloorId(newFloorId);
  }, []);

  const addItem = useCallback(({ item: itemToAdd, selectedAddons = [], itemQuantity, instructions, selectedVariant }: AddToCartOptions) => {
    const isDeal = itemToAdd.categoryId === 'C-00001';

    const getVariationId = (addons: SelectedAddon[], instr: string, variant?: MenuItemVariant) => {
      const addonString = addons.length > 0 
        ? addons.map(a => `${a.id}x${a.quantity}`).sort().join(',')
        : 'no-addons';
      const instructionString = instr.trim().toLowerCase();
      const variantString = variant ? variant.name : 'no-variant';
      return `${variantString}|${addonString}|${instructionString}`;
    };
    
    const variationId = getVariationId(selectedAddons, instructions, selectedVariant);

    setItems(prevItems => {
        const existingItem = prevItems.find(
            item => item.id === itemToAdd.id && item.uniqueVariationId === variationId
        );

        if (existingItem) {
            return prevItems.map(item =>
                item.cartItemId === existingItem.cartItemId
                    ? { ...item, quantity: item.quantity + itemQuantity }
                    : item
            );
        }

        const newItems: CartItem[] = [];
        const parentDealId = crypto.randomUUID();

        const addonPrice = selectedAddons.reduce((sum, addon) => sum + (addon.selectedPrice * addon.quantity), 0);
        const basePrice = isDeal ? itemToAdd.price : (selectedVariant ? selectedVariant.price : itemToAdd.price);
        const finalPrice = basePrice + addonPrice;

        newItems.push({
            ...itemToAdd,
            cartItemId: parentDealId,
            uniqueVariationId: variationId,
            price: finalPrice,
            basePrice: basePrice,
            selectedAddons: selectedAddons,
            selectedVariant: selectedVariant,
            quantity: itemQuantity,
            instructions: instructions.trim() || undefined,
            isDealComponent: false,
        });

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
        return [...prevItems, ...newItems];
    });

    toast({
        title: "Added to Cart",
        description: `${itemQuantity}x ${itemToAdd.name} ${selectedVariant ? `(${selectedVariant.name})` : ''} is now in your order.`,
    });
  }, [menu.items, toast]);


  const updateQuantity = useCallback((cartItemId: string, change: number) => {
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
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setTableId(null);
    setFloorId(null);
    setDeliveryMode(null);
    setCustomerName(null);
    setCustomerPhone(null);
    setCustomerAddress(null);
  }, []);
  
  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

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
        deliveryMode,
        customerName,
        customerPhone,
        customerAddress,
        isCartOpen,
        setIsCartOpen,
        addItem,
        updateQuantity,
        clearCart,
        closeCart,
        setOrderDetails,
        setCustomerDetails,
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

    
