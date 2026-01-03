

"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Deal } from '@/lib/types';
import { initialDeals as defaultDeals } from '@/lib/data';
import { useActivityLog } from './ActivityLogContext';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useMenu } from './MenuContext';

interface DealsContextType {
  deals: Deal[];
  isLoading: boolean;
  addDeal: (deal: Deal) => void;
  updateDeal: (deal: Deal) => void;
  deleteDeal: (id: string, name: string) => void;
}

const DealsContext = createContext<DealsContextType | undefined>(undefined);

const DEALS_STORAGE_KEY = 'cheeziousDeals';

export const DealsProvider = ({ children }: { children: ReactNode }) => {
  const [deals, setDeals] = useState<Deal[]>(defaultDeals);
  const [isLoading, setIsLoading] = useState(true);
  const { logActivity } = useActivityLog();
  const { user } = useAuth();
  const { toast } = useToast();
  const { menu } = useMenu();

  useEffect(() => {
    try {
      const storedDeals = localStorage.getItem(DEALS_STORAGE_KEY);
      if (storedDeals) {
        const parsed = JSON.parse(storedDeals);
        if (Array.isArray(parsed)) {
            setDeals(parsed);
        }
      } else {
        setDeals(defaultDeals); // Load initial deals if nothing is in storage
      }
    } catch (error) {
      console.error("Could not load deals from local storage", error);
      setDeals(defaultDeals);
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

  const addDeal = useCallback((newDeal: Deal) => {
    if (!newDeal.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Deal Code is required.' });
      return;
    }
    if (deals.some(deal => deal.id === newDeal.id) || menu.items.some(item => item.id === newDeal.id)) {
      toast({ variant: 'destructive', title: 'Error', description: `An item or deal with the code '${newDeal.id}' already exists.` });
      return;
    }
    setDeals(d => [...d, newDeal]);
    logActivity(`Added new deal: '${newDeal.name}'.`, user?.username || 'System', 'Deal');
  }, [logActivity, user, deals, menu.items, toast]);

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
