
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Deal } from '@/lib/types';
import { menuItems } from '@/lib/data'; // Using some menu items as initial deals
import { useActivityLog } from './ActivityLogContext';
import { useAuth } from './AuthContext';
import { generateUniqueCode } from '@/lib/utils';

interface DealsContextType {
  deals: Deal[];
  isLoading: boolean;
  addDeal: (deal: Omit<Deal, 'id'>) => void;
  updateDeal: (deal: Deal) => void;
  deleteDeal: (id: string, name: string) => void;
}

const DealsContext = createContext<DealsContextType | undefined>(undefined);

const DEALS_STORAGE_KEY = 'cheeziousDeals';

// Use some of the existing "deal" menu items as the initial state for our new deals system.
const initialDeals: Deal[] = menuItems
  .filter(item => item.categoryId === 'deals')
  .map(({ id, name, description, price, imageUrl }) => ({ id, name, description, price, imageUrl }));


export const DealsProvider = ({ children }: { children: ReactNode }) => {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [isLoading, setIsLoading] = useState(true);
  const { logActivity } = useActivityLog();
  const { user } = useAuth();

  useEffect(() => {
    try {
      const storedDeals = localStorage.getItem(DEALS_STORAGE_KEY);
      if (storedDeals) {
        const parsed = JSON.parse(storedDeals);
        if (Array.isArray(parsed)) {
            setDeals(parsed);
        }
      }
    } catch (error) {
      console.error("Could not load deals from local storage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
        if (!isLoading) {
            localStorage.setItem(DEALS_STORAGE_KEY, JSON.stringify(deals));
        }
    } catch (error) {
      console.error("Could not save deals to local storage", error);
    }
  }, [deals, isLoading]);

  const addDeal = useCallback((deal: Omit<Deal, 'id'>) => {
    const newDeal: Deal = { ...deal, id: generateUniqueCode('D') };
    setDeals(d => [...d, newDeal]);
    logActivity(`Added new deal: '${deal.name}'.`, user?.username || 'System', 'Deal');
  }, [logActivity, user]);

  const updateDeal = useCallback((updatedDeal: Deal) => {
    setDeals(d => d.map(deal => deal.id === updatedDeal.id ? updatedDeal : deal));
    logActivity(`Updated deal: '${updatedDeal.name}'.`, user?.username || 'System', 'Deal');
  }, [logActivity, user]);

  const deleteDeal = useCallback((id: string, name: string) => {
    setDeals(d => d.filter(deal => deal.id !== id));
    logActivity(`Deleted deal: '${name}'.`, user?.username || 'System', 'Deal');
  }, [logActivity, user]);

  return (
    <DealsContext.Provider
      value={{
        deals,
        isLoading,
        addDeal,
        updateDeal,
        deleteDeal,
      }}
    >
      {children}
    </DealsContext.Provider>
  );
};

export const useDeals = () => {
  const context = useContext(DealsContext);
  if (context === undefined) {
    throw new Error('useDeals must be used within a DealsProvider');
  }
  return context;
};
