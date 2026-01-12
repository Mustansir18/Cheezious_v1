
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { MenuItem, MenuCategory, Addon, SubCategory } from '@/lib/types';
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
  // Sub Categories
  addSubCategory: (categoryId: string, subCategoryName: string) => void;
  deleteSubCategory: (categoryId: string, subCategoryId: string) => void;
  // Items (including Deals)
  addItem: (item: MenuItem) => void;
  updateItem: (item: MenuItem) => void;
  deleteItem: (id: string, name: string) => void;
  // Addons
  addAddon: (addon: Addon) => void;
  updateAddon: (addon: Addon) => void;
  deleteAddon: (id: string, name: string) => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

const MENU_STORAGE_KEY = 'cheeziousMenuV3';

const initialData: MenuData = {
    items: [],
    categories: [],
    addons: [],
};

export const MenuProvider = ({ children }: { children: ReactNode }) => {
  const [menu, setMenu] = useState<MenuData>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const { logActivity } = useActivityLog();
  const { user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    async function loadMenuData() {
        setIsLoading(true);
        try {
            const response = await fetch('/api/menu');
            if (!response.ok) {
                throw new Error('Failed to fetch menu data');
            }
            const data = await response.json();
            setMenu({
                items: data.items || [],
                categories: data.categories || [],
                addons: data.addons || [],
            });
        } catch (error) {
            console.error("Could not load menu from API", error);
            toast({
                variant: 'destructive',
                title: 'Failed to Load Menu',
                description: 'Could not connect to the server to get menu data. Please try again later.'
            });
            // Fallback to empty data if API fails
            setMenu(initialData);
        } finally {
            setIsLoading(false);
        }
    }
    loadMenuData();
  }, [toast]);


  // The useEffect for localStorage is no longer the primary source of truth.
  // In a full migration, this would be removed. For now, we'll keep it to persist
  // any changes made during the session, but the initial load is from the API.
  useEffect(() => {
    try {
        if (!isLoading) {
            localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menu));
        }
    } catch (error) {
      console.error("Could not save menu to local storage", error);
    }
  }, [menu, isLoading]);

  // Listen for storage changes from other tabs to keep them in sync
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === MENU_STORAGE_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          if (parsed.items && parsed.categories && parsed.addons) {
            setMenu(parsed);
          }
        } catch (error) {
          console.error("Failed to parse menu from storage event", error);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const addCategory = (newCategory: MenuCategory) => {
    if (!newCategory.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Category Code is required.' });
      return;
    }
    if (menu.categories.some(c => c.id === newCategory.id)) {
      toast({ variant: 'destructive', title: 'Error', description: `A category with the code '${newCategory.id}' already exists.` });
      return;
    }
    // In a real app, this would be a POST request to /api/categories
    setMenu(m => ({ ...m, categories: [...m.categories, newCategory] }));
    logActivity(`Added menu category: '${newCategory.name}'.`, user?.username || 'System', 'Menu');
  };

  const updateCategory = (category: MenuCategory) => {
    // In a real app, this would be a PUT request to /api/categories/:id
    setMenu(m => ({ ...m, categories: m.categories.map(c => c.id === category.id ? category : c) }));
    logActivity(`Updated menu category: '${category.name}'.`, user?.username || 'System', 'Menu');
  };

  const deleteCategory = (id: string, name: string) => {
    // In a real app, this would be a DELETE request to /api/categories/:id
    setMenu(m => {
      const newItems = m.items.filter(i => i.categoryId !== id);
      const newCategories = m.categories.filter(c => c.id !== id);
      return { ...m, items: newItems, categories: newCategories };
    });
    logActivity(`Deleted menu category: '${name}' and its items.`, user?.username || 'System', 'Menu');
  };
  
  const addSubCategory = (categoryId: string, subCategoryName: string) => {
    const newSubCategory: SubCategory = {
      id: `SC-${crypto.randomUUID().slice(0, 5)}`,
      name: subCategoryName,
    };
    // In a real app, this would be a POST request to /api/categories/:id/subcategories
    setMenu(m => ({
      ...m,
      categories: m.categories.map(c => {
        if (c.id === categoryId) {
          const updatedSubCategories = [...(c.subCategories || []), newSubCategory];
          return { ...c, subCategories: updatedSubCategories };
        }
        return c;
      })
    }));
    const categoryName = menu.categories.find(c => c.id === categoryId)?.name;
    logActivity(`Added sub-category '${subCategoryName}' to '${categoryName}'.`, user?.username || 'System', 'Menu');
  };

  const deleteSubCategory = (categoryId: string, subCategoryId: string) => {
    // In a real app, this would be a DELETE request to /api/categories/:id/subcategories/:subId
    setMenu(m => ({
      ...m,
      categories: m.categories.map(c => {
        if (c.id === categoryId) {
          const updatedSubCategories = c.subCategories?.filter(sc => sc.id !== subCategoryId);
          return { ...c, subCategories: updatedSubCategories };
        }
        return c;
      }),
      // Also unassign items from this sub-category
      items: m.items.map(i => i.subCategoryId === subCategoryId ? { ...i, subCategoryId: undefined } : i)
    }));
    const subCategoryName = menu.categories.find(c => c.id === categoryId)?.subCategories?.find(sc => sc.id === subCategoryId)?.name;
    logActivity(`Deleted sub-category '${subCategoryName}'.`, user?.username || 'System', 'Menu');
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
    // In a real app, this would be a POST request to /api/items
    setMenu(m => ({ ...m, items: [...m.items, newItem] }));
    const logMessage = newItem.categoryId === 'C-00001' ? `Added new deal: '${newItem.name}'.` : `Added menu item: '${newItem.name}'.`;
    logActivity(logMessage, user?.username || 'System', 'Menu');
  };

  const updateItem = (item: MenuItem) => {
    // In a real app, this would be a PUT request to /api/items/:id
    setMenu(m => ({ ...m, items: m.items.map(i => i.id === item.id ? item : i) }));
     const logMessage = item.categoryId === 'C-00001' ? `Updated deal: '${item.name}'.` : `Updated menu item: '${item.name}'.`;
    logActivity(logMessage, user?.username || 'System', 'Menu');
  };

  const deleteItem = (id: string, name: string) => {
    const item = menu.items.find(i => i.id === id);
    // In a real app, this would be a DELETE request to /api/items/:id
    setMenu(m => ({ ...m, items: m.items.filter(i => i.id !== id) }));
    const logMessage = item?.categoryId === 'C-00001' ? `Deleted deal: '${name}'.` : `Deleted menu item: '${name}'.`;
    logActivity(logMessage, user?.username || 'System', 'Menu');
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
    // In a real app, this would be a POST request to /api/addons
    setMenu(m => ({ ...m, addons: [...m.addons, newAddon] }));
    logActivity(`Added add-on: '${newAddon.name}'.`, user?.username || 'System', 'Menu');
  };
  
  const updateAddon = (addon: Addon) => {
    // In a real app, this would be a PUT request to /api/addons/:id
    setMenu(m => ({ ...m, addons: m.addons.map(a => a.id === addon.id ? addon : a) }));
    logActivity(`Updated add-on: '${addon.name}'.`, user?.username || 'System', 'Menu');
  };

  const deleteAddon = (id: string, name: string) => {
    // In a real app, this would be a DELETE request to /api/addons/:id
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
        addSubCategory,
        deleteSubCategory,
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

    
