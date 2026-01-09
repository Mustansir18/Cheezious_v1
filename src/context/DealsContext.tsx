
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Deal } from '@/lib/types';
// import { initialDeals as defaultDeals } from '@/lib/data';
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

// This context is no longer the source of truth for deals. 
// It is now managed within MenuContext.
// This file is kept for now to avoid breaking imports, but it should be deprecated.
const defaultDeals: Deal[] = [];

export const DealsProvider = ({ children }: { children: ReactNode }) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { logActivity } = useActivityLog();
  const { user } = useAuth();
  const { toast } = useToast();
  const { menu } = useMenu();

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const addDeal = useCallback((newDeal: Deal) => {
    toast({ variant: 'destructive', title: 'Deprecated', description: 'addDeal is deprecated.' });
  }, [toast]);

  const updateDeal = useCallback((updatedDeal: Deal) => {
    toast({ variant: 'destructive', title: 'Deprecated', description: 'updateDeal is deprecated.' });
  }, [toast]);

  const deleteDeal = useCallback((id: string, name: string) => {
    toast({ variant: 'destructive', title: 'Deprecated', description: 'deleteDeal is deprecated.' });
  }, [toast]);

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
