

"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { CashierLogEntry } from '@/lib/types';
import { useAuth } from './AuthContext';

interface CashierLogContextType {
  logs: CashierLogEntry[];
  isLoading: boolean;
  logTransaction: (details: Omit<CashierLogEntry, 'id' | 'timestamp' | 'adminId' | 'adminName'>) => void;
  clearLogs: () => void;
}

const CashierLogContext = createContext<CashierLogContextType | undefined>(undefined);

const LOG_STORAGE_KEY = 'cheeziousCashierLog';

export const CashierLogProvider = ({ children }: { children: ReactNode }) => {
  const [logs, setLogs] = useState<CashierLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, updateUserBalance } = useAuth();

  useEffect(() => {
    try {
      const storedLogs = localStorage.getItem(LOG_STORAGE_KEY);
      if (storedLogs) {
        setLogs(JSON.parse(storedLogs));
      }
    } catch (error) {
      console.error("Could not load cashier logs from local storage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
    }
  }, [logs, isLoading]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LOG_STORAGE_KEY && event.newValue) {
        try {
          setLogs(JSON.parse(event.newValue));
        } catch (error) {
          console.error("Failed to parse cashier logs from storage event", error);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const logTransaction = useCallback((details: Omit<CashierLogEntry, 'id' | 'timestamp' | 'adminId' | 'adminName'>) => {
    if (!user) return;

    const newLog: CashierLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      adminId: user.id,
      adminName: user.username,
      ...details,
    };
    
    setLogs(prevLogs => [newLog, ...prevLogs].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

    const operation = details.type === 'deposit' ? 'add' : 'subtract';
    updateUserBalance(details.cashierId, details.amount, operation);
  }, [user, updateUserBalance]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <CashierLogContext.Provider value={{ logs, isLoading, logTransaction, clearLogs }}>
      {children}
    </CashierLogContext.Provider>
  );
};

export const useCashierLog = () => {
  const context = useContext(CashierLogContext);
  if (context === undefined) {
    throw new Error('useCashierLog must be used within a CashierLogProvider');
  }
  return context;
};
