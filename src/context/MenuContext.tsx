
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
  
  const prevMenu = usePrevious(menu);


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

    const createLogger = <T extends {id: string, name: string}>(
        dataType: keyof MenuData,
        addMsg: (name: string) => string,
        updateMsg: (name: string) => string,
        deleteMsg: (name: string) => string,
    ) => {
         useEffect(() => {
            if (!prevMenu || isLoading) return;

            const oldData = prevMenu[dataType] as T[];
            const newData = menu[dataType] as T[];

            if (newData.length > oldData.length) {
                const added = newData.find(n => !oldData.some(o => o.id === n.id));
                if (added) logActivity(addMsg(added.name), user?.username || 'System');
            } else if (newData.length < oldData.length) {
                const deleted = oldData.find(o => !newData.some(n => n.id === o.id));
                if (deleted) logActivity(deleteMsg(deleted.name), user?.username || 'System');
            } else {
                 const updated = newData.find(n => {
                    const old = oldData.find(o => o.id === n.id);
                    return old && JSON.stringify(old) !== JSON.stringify(n);
                });
                if (updated) logActivity(updateMsg(updated.name), user?.username || 'System');
            }
        }, [menu[dataType], prevMenu, isLoading, logActivity, user?.username]);
    }

    createLogger<MenuCategory>('categories', name => `Added menu category: '${name}'.`, name => `Updated menu category: '${name}'.`, name => `Deleted menu category: '${name}'.`);
    createLogger<MenuItem>('items', name => `Added menu item: '${name}'.`, name => `Updated menu item: '${name}'.`, name => `Deleted menu item: '${name}'.`);
    createLogger<Addon>('addons', name => `Added add-on: '${name}'.`, name => `Updated add-on: '${name}'.`, name => `Deleted add-on: '${name}'.`);
    createLogger<AddonCategory>('addonCategories', name => `Added add-on category: '${name}'.`, name => `Updated add-on category: '${name}'.`, name => `Deleted add-on category: '${name}'.`);


  const createUpdater = <T extends {id: string, name: string}>(dataType: keyof MenuData, action: 'add' | 'update' | 'delete') => 
    (itemOrId: T | Omit<T, 'id'> | string) => {
      setMenu(m => {
          const dataArray = m[dataType] as T[];
          let newArray;
          switch (action) {
              case 'add': newArray = [...dataArray, { ...(itemOrId as Omit<T, 'id'>), id: crypto.randomUUID() }]; break;
              case 'update': newArray = dataArray.map(i => i.id === (itemOrId as T).id ? (itemOrId as T) : i); break;
              case 'delete': newArray = dataArray.filter(i => i.id !== itemOrId); break;
              default: newArray = dataArray;
          }
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
        addCategory: createUpdater<MenuCategory>('categories', 'add'),
        updateCategory: createUpdater<MenuCategory>('categories', 'update'),
        deleteCategory: deleteCategoryAndChildren,
        addItem: createUpdater<MenuItem>('items', 'add'),
        updateItem: createUpdater<MenuItem>('items', 'update'),
        deleteItem: createUpdater<MenuItem>('items', 'delete'),
        addAddon: createUpdater<Addon>('addons', 'add'),
        updateAddon: createUpdater<Addon>('addons', 'update'),
        deleteAddon: createUpdater<Addon>('addons', 'delete'),
        addAddonCategory: createUpdater<AddonCategory>('addonCategories', 'add'),
        updateAddonCategory: createUpdater<AddonCategory>('addonCategories', 'update'),
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
