
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { MenuItem } from '@/lib/types';
import { useActivityLog } from './ActivityLogContext';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface DealsContextType {
  deals: MenuItem[];
  isLoading: boolean;
  addDeal: (deal: MenuItem) => void;
  updateDeal: (deal: MenuItem) => void;
  deleteDeal: (id: string, name: string) => void;
}

const DealsContext = createContext<DealsContextType | undefined>(undefined);

const DEALS_STORAGE_KEY = 'cheeziousDeals';

export const DealsProvider = ({ children }: { children: ReactNode }) => {
  const [deals, setDeals] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { logActivity } = useActivityLog();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    async function loadDealsData() {
        setIsLoading(true);
        try {
            const response = await fetch('/api/deals');
            if (!response.ok) {
                throw new Error('Failed to fetch deals data');
            }
            const data = await response.json();
            setDeals(data.deals || []);
        } catch (error) {
            console.error("Could not load deals from API", error);
            toast({
                variant: 'destructive',
                title: 'Failed to Load Deals',
                description: 'Could not connect to the server to get promotional deals.'
            });
            setDeals([]);
        } finally {
            setIsLoading(false);
        }
    }
    loadDealsData();
  }, [toast]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(DEALS_STORAGE_KEY, JSON.stringify(deals));
    }
  }, [deals, isLoading]);
  
  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === DEALS_STORAGE_KEY && event.newValue) {
        try {
          setDeals(JSON.parse(event.newValue));
        } catch (error) {
          console.error("Failed to parse deals from storage event", error);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const addDeal = useCallback((newDeal: MenuItem) => {
    setDeals(prev => [...prev, newDeal]);
    logActivity(`Added new deal: '${newDeal.name}'.`, user?.username || 'System', 'Deal');
  }, [logActivity, user]);

  const updateDeal = useCallback((updatedDeal: MenuItem) => {
    setDeals(prev => prev.map(d => d.id === updatedDeal.id ? updatedDeal : d));
    logActivity(`Updated deal: '${updatedDeal.name}'.`, user?.username || 'System', 'Deal');
  }, [logActivity, user]);

  const deleteDeal = useCallback((id: string, name: string) => {
    setDeals(prev => prev.filter(d => d.id !== id));
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
