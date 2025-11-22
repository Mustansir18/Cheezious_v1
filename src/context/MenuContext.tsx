
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { menuItems as initialMenuItems, menuCategories as initialMenuCategories } from '@/lib/data';
import type { MenuItem, MenuCategory } from '@/lib/types';

interface MenuData {
    items: MenuItem[];
    categories: MenuCategory[];
}

interface MenuContextType {
  menu: MenuData;
  isLoading: boolean;
  addCategory: (category: Omit<MenuCategory, 'id'>) => void;
  updateCategory: (category: MenuCategory) => void;
  deleteCategory: (id: string) => void;
  addItem: (item: Omit<MenuItem, 'id'>) => void;
  updateItem: (item: MenuItem) => void;
  deleteItem: (id: string) => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

const MENU_STORAGE_KEY = 'cheeziousMenu';

const initialData: MenuData = {
    items: initialMenuItems,
    categories: initialMenuCategories,
};

export const MenuProvider = ({ children }: { children: ReactNode }) => {
  const [menu, setMenu] = useState<MenuData>(initialData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedMenu = localStorage.getItem(MENU_STORAGE_KEY);
      if (storedMenu) {
        const parsed = JSON.parse(storedMenu);
        if (parsed.items && parsed.categories) {
            setMenu(parsed);
        }
      }
    } catch (error) {
      console.error("Could not load menu from local storage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
        if (!isLoading) {
            localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menu));
        }
    } catch (error) {
      console.error("Could not save menu to local storage", error);
    }
  }, [menu, isLoading]);

  const addCategory = useCallback((category: Omit<MenuCategory, 'id'>) => {
    const newCategory: MenuCategory = { ...category, id: crypto.randomUUID() };
    setMenu(m => ({ ...m, categories: [...m.categories, newCategory] }));
  }, []);

  const updateCategory = useCallback((updatedCategory: MenuCategory) => {
    setMenu(m => ({
        ...m,
        categories: m.categories.map(c => c.id === updatedCategory.id ? updatedCategory : c)
    }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setMenu(m => ({ 
        ...m, 
        categories: m.categories.filter(c => c.id !== id),
        items: m.items.filter(i => i.categoryId !== id) // Also remove items in that category
    }));
  }, []);

  const addItem = useCallback((item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = { ...item, id: crypto.randomUUID() };
    setMenu(m => ({ ...m, items: [...m.items, newItem] }));
  }, []);

  const updateItem = useCallback((updatedItem: MenuItem) => {
    setMenu(m => ({
        ...m,
        items: m.items.map(i => i.id === updatedItem.id ? updatedItem : i)
    }));
  }, []);

  const deleteItem = useCallback((id: string) => {
    setMenu(m => ({ ...m, items: m.items.filter(i => i.id !== id) }));
  }, []);

  return (
    <MenuContext.Provider
      value={{
        menu,
        isLoading,
        addCategory,
        updateCategory,
        deleteCategory,
        addItem,
        updateItem,
        deleteItem,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};

