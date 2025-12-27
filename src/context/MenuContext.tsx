
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { menuItems as initialMenuItems, menuCategories as initialMenuCategories, addons as initialAddons } from '@/lib/data';
import type { MenuItem, MenuCategory, Addon } from '@/lib/types';
import { useActivityLog } from './ActivityLogContext';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface MenuData {
    items: MenuItem[];
    categories: MenuCategory[];
    addons: Addon[];
}

interface MenuContextType {
  menu: MenuData;
  isLoading: boolean;
  // Categories
  addCategory: (category: MenuCategory) => void;
  updateCategory: (category: MenuCategory) => void;
  deleteCategory: (id: string, name: string) => void;
  // Items
  addItem: (item: MenuItem) => void;
  updateItem: (item: MenuItem) => void;
  deleteItem: (id: string, name: string) => void;
  // Addons
  addAddon: (addon: Addon) => void;
  updateAddon: (addon: Addon) => void;
  deleteAddon: (id: string, name: string) => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

const MENU_STORAGE_KEY = 'cheeziousMenu';

const initialData: MenuData = {
    items: initialMenuItems,
    categories: initialMenuCategories,
    addons: initialAddons,
};

function usePrevious<T>(value: T) {
    const ref = React.useRef<T>();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

export const MenuProvider = ({ children }: { children: ReactNode }) => {
  const [menu, setMenu] = useState<MenuData>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const { logActivity } = useActivityLog();
  const { user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    try {
      const storedMenu = localStorage.getItem(MENU_STORAGE_KEY);
      if (storedMenu) {
        const parsed = JSON.parse(storedMenu);
        // Add a check for the simplified structure
        if (parsed.items && parsed.categories && parsed.addons) {
            setMenu({ ...parsed, addonCategories: parsed.addonCategories || [] });
        } else {
             setMenu(initialData); // Fallback to initial if structure is wrong
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
            const { addonCategories, ...menuToSave } = menu;
            localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menuToSave));
        }
    } catch (error) {
      console.error("Could not save menu to local storage", error);
    }
  }, [menu, isLoading]);

  const addCategory = (newCategory: MenuCategory) => {
    if (!newCategory.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Category Code is required.' });
      return;
    }
    if (menu.categories.some(c => c.id === newCategory.id)) {
      toast({ variant: 'destructive', title: 'Error', description: `A category with the code '${newCategory.id}' already exists.` });
      return;
    }
    setMenu(m => ({ ...m, categories: [...m.categories, newCategory] }));
    logActivity(`Added menu category: '${newCategory.name}'.`, user?.username || 'System', 'Menu');
  };

  const updateCategory = (category: MenuCategory) => {
    setMenu(m => ({ ...m, categories: m.categories.map(c => c.id === category.id ? category : c) }));
    logActivity(`Updated menu category: '${category.name}'.`, user?.username || 'System', 'Menu');
  };

  const deleteCategory = (id: string, name: string) => {
    setMenu(m => {
      const newItems = m.items.filter(i => i.categoryId !== id);
      const newCategories = m.categories.filter(c => c.id !== id);
      return { ...m, items: newItems, categories: newCategories };
    });
    logActivity(`Deleted menu category: '${name}' and its items.`, user?.username || 'System', 'Menu');
  };

  const addItem = (newItem: MenuItem) => {
     if (!newItem.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Item Code is required.' });
      return;
    }
    if (menu.items.some(i => i.id === newItem.id)) {
      toast({ variant: 'destructive', title: 'Error', description: `An item with the code '${newItem.id}' already exists.` });
      return;
    }
    setMenu(m => ({ ...m, items: [...m.items, newItem] }));
    logActivity(`Added menu item: '${newItem.name}'.`, user?.username || 'System', 'Menu');
  };

  const updateItem = (item: MenuItem) => {
    setMenu(m => ({ ...m, items: m.items.map(i => i.id === item.id ? item : i) }));
    logActivity(`Updated menu item: '${item.name}'.`, user?.username || 'System', 'Menu');
  };

  const deleteItem = (id: string, name: string) => {
    setMenu(m => ({ ...m, items: m.items.filter(i => i.id !== id) }));
    logActivity(`Deleted menu item: '${name}'.`, user?.username || 'System', 'Menu');
  };

  const addAddon = (newAddon: Addon) => {
    if (!newAddon.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Add-on Code is required.' });
      return;
    }
    if (menu.addons.some(a => a.id === newAddon.id)) {
      toast({ variant: 'destructive', title: 'Error', description: `An add-on with the code '${newAddon.id}' already exists.` });
      return;
    }
    setMenu(m => ({ ...m, addons: [...m.addons, newAddon] }));
    logActivity(`Added add-on: '${newAddon.name}'.`, user?.username || 'System', 'Menu');
  };
  
  const updateAddon = (addon: Addon) => {
    setMenu(m => ({ ...m, addons: m.addons.map(a => a.id === addon.id ? addon : a) }));
    logActivity(`Updated add-on: '${addon.name}'.`, user?.username || 'System', 'Menu');
  };

  const deleteAddon = (id: string, name: string) => {
    setMenu(m => {
      const newItems = m.items.map(item => ({
          ...item,
          availableAddonIds: item.availableAddonIds?.filter(addonId => addonId !== id)
      }));
      const newAddons = m.addons.filter(a => a.id !== id);
      return { ...m, addons: newAddons, items: newItems };
    });
    logActivity(`Deleted add-on: '${name}'.`, user?.username || 'System', 'Menu');
  };

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
        addAddon,
        updateAddon,
        deleteAddon,
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
