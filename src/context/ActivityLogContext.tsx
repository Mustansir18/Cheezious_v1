
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { ActivityLog, ActivityLogCategory } from '@/lib/types';

interface ActivityLogContextType {
  logs: ActivityLog[];
  isLoading: boolean;
  logActivity: (message: string, user: string, category: ActivityLogCategory) => void;
  clearLogs: () => void;
}

const ActivityLogContext = createContext<ActivityLogContextType | undefined>(undefined);

const LOG_STORAGE_KEY = 'cheeziousActivityLog';

export const ActivityLogProvider = ({ children }: { children: ReactNode }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load logs from localStorage on initial render
  useEffect(() => {
    try {
      const storedLogs = localStorage.getItem(LOG_STORAGE_KEY);
      if (storedLogs) {
        setLogs(JSON.parse(storedLogs));
      }
    } catch (error) {
      console.error("Could not load activity logs from local storage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Persist logs to localStorage whenever they change
  useEffect(() => {
    try {
      if (!isLoading) {
        localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
      }
    } catch (error) {
      console.error("Could not save activity logs to local storage", error);
    }
  }, [logs, isLoading]);

  const logActivity = useCallback((message: string, user: string, category: ActivityLogCategory) => {
    const newLog: ActivityLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      user: user || 'System',
      message: message,
      category: category,
    };
    
    // Use a function form of setState to prevent issues during render cycles
    setLogs(prevLogs => {
      // Create a new array to ensure React detects the state change
      const newLogs = [newLog, ...prevLogs];
      return newLogs;
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    logActivity('Cleared all activity logs.', 'System', 'System');
  }, [logActivity]);

  return (
    <ActivityLogContext.Provider
      value={{
        logs,
        isLoading,
        logActivity,
        clearLogs,
      }}
    >
      {children}
    </ActivityLogContext.Provider>
  );
};

export const useActivityLog = () => {
  const context = useContext(ActivityLogContext);
  if (context === undefined) {
    throw new Error('useActivityLog must be used within an ActivityLogProvider');
  }
  return context;
};
