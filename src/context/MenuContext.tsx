
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { menuItems as initialMenuItems, menuCategories as initialMenuCategories, addons as initialAddons, addonCategories as initialAddonCategories } from '@/lib/data';
import type { MenuItem, MenuCategory, Addon, AddonCategory } from '@/lib/types';
import { useActivityLog } from './ActivityLogContext';
import { useAuth } from './AuthContext';

interface MenuData {
    items: MenuItem[];
    categories: MenuCategory[];
    addons: Addon[];
    addonCategories: AddonCategory[];
}

interface MenuContextType {
  menu: MenuData;
  isLoading: boolean;
  // Categories
  addCategory: (category: Omit<MenuCategory, 'id'>) => void;
  updateCategory: (category: MenuCategory) => void;
  deleteCategory: (id: string, name: string) => void;
  // Items
  addItem: (item: Omit<MenuItem, 'id'>) => void;
  updateItem: (item: MenuItem) => void;
  deleteItem: (id: string, name: string) => void;
  // Addons
  addAddon: (addon: Omit<Addon, 'id'>) => void;
  updateAddon: (addon: Addon) => void;
  deleteAddon: (id: string, name: string) => void;
  // Addon Categories
  addAddonCategory: (category: Omit<AddonCategory, 'id'>) => void;
  updateAddonCategory: (category: AddonCategory) => void;
  deleteAddonCategory: (id: string, name: string) => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

const MENU_STORAGE_KEY = 'cheeziousMenu';

const initialData: MenuData = {
    items: initialMenuItems,
    categories: initialMenuCategories,
    addons: initialAddons,
    addonCategories: initialAddonCategories,
};

export const MenuProvider = ({ children }: { children: ReactNode }) => {
  const [menu, setMenu] = useState<MenuData>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const { logActivity } = useActivityLog();
  const { user } = useAuth();

  useEffect(() => {
    try {
      const storedMenu = localStorage.getItem(MENU_STORAGE_KEY);
      if (storedMenu) {
        const parsed = JSON.parse(storedMenu);
        if (parsed.items && parsed.categories && parsed.addons && parsed.addonCategories) {
            setMenu(parsed);
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
            localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menu));
        }
    } catch (error) {
      console.error("Could not save menu to local storage", error);
    }
  }, [menu, isLoading]);

  // Generic handler to reduce boilerplate
  const createUpdater = <T extends {id: string, name: string}>(
    dataType: keyof MenuData, 
    action: 'add' | 'update' | 'delete', 
    logMessage: (name: string) => string
  ) => (itemOrId: T | Omit<T, 'id'> | string, name?: string) => {
      setMenu(m => {
          const dataArray = m[dataType] as T[];
          let newArray;
          let itemName = name || (typeof itemOrId === 'object' && 'name' in itemOrId ? itemOrId.name : 'unknown');

          switch (action) {
              case 'add':
                  newArray = [...dataArray, { ...(itemOrId as Omit<T, 'id'>), id: crypto.randomUUID() }];
                  break;
              case 'update':
                  const updatedItem = itemOrId as T;
                  itemName = updatedItem.name;
                  newArray = dataArray.map(i => i.id === updatedItem.id ? updatedItem : i);
                  break;
              case 'delete':
                  newArray = dataArray.filter(i => i.id !== itemOrId);
                  break;
              default:
                  newArray = dataArray;
          }
          logActivity(logMessage(itemName), user?.username || 'System');
          return { ...m, [dataType]: newArray };
      });
  };

  const deleteCategoryAndChildren = useCallback((id: string, name: string) => {
    setMenu(m => {
        const newCategories = m.categories.filter(c => c.id !== id);
        const newItems = m.items.filter(i => i.categoryId !== id);
        logActivity(`Deleted menu category: '${name}' and all its items.`, user?.username || 'System');
        return { ...m, categories: newCategories, items: newItems };
    });
  }, [logActivity, user]);
  
  const deleteAddonCategoryAndChildren = useCallback((id: string, name: string) => {
    setMenu(m => {
        const newAddonCategories = m.addonCategories.filter(c => c.id !== id);
        const addonsToDelete = m.addons.filter(a => a.addonCategoryId === id).map(a => a.id);
        const newAddons = m.addons.filter(a => a.addonCategoryId !== id);
        const newItems = m.items.map(item => ({
            ...item,
            availableAddonIds: item.availableAddonIds?.filter(addonId => !addonsToDelete.includes(addonId))
        }));
        logActivity(`Deleted add-on category: '${name}' and all its add-ons.`, user?.username || 'System');
        return { ...m, addonCategories: newAddonCategories, addons: newAddons, items: newItems };
    });
  }, [logActivity, user]);

  return (
    <MenuContext.Provider
      value={{
        menu,
        isLoading,
        addCategory: createUpdater<MenuCategory>('categories', 'add', name => `Added menu category: '${name}'.`),
        updateCategory: createUpdater<MenuCategory>('categories', 'update', name => `Updated menu category: '${name}'.`),
        deleteCategory: deleteCategoryAndChildren,
        addItem: createUpdater<MenuItem>('items', 'add', name => `Added menu item: '${name}'.`),
        updateItem: createUpdater<MenuItem>('items', 'update', name => `Updated menu item: '${name}'.`),
        deleteItem: createUpdater<MenuItem>('items', 'delete', name => `Deleted menu item: '${name}'.`),
        addAddon: createUpdater<Addon>('addons', 'add', name => `Added add-on: '${name}'.`),
        updateAddon: createUpdater<Addon>('addons', 'update', name => `Updated add-on: '${name}'.`),
        deleteAddon: createUpdater<Addon>('addons', 'delete', name => `Deleted add-on: '${name}'.`),
        addAddonCategory: createUpdater<AddonCategory>('addonCategories', 'add', name => `Added add-on category: '${name}'.`),
        updateAddonCategory: createUpdater<AddonCategory>('addonCategories', 'update', name => `Updated add-on category: '${name}'.`),
        deleteAddonCategory: deleteAddonCategoryAndChildren,
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
