
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { ActivityLog, ActivityLogCategory } from '@/lib/types';
import { useSyncLocalStorage } from '@/hooks/use-sync-local-storage';

interface ActivityLogContextType {
  logs: ActivityLog[];
  isLoading: boolean;
  logActivity: (message: string, user: string, category: ActivityLogCategory) => void;
  clearLogs: () => void;
}

const ActivityLogContext = createContext<ActivityLogContextType | undefined>(undefined);

export const ActivityLogProvider = ({ children }: { children: ReactNode }) => {
  const [logs, setLogs, isLoading] = useSyncLocalStorage<ActivityLog[]>('activityLog', [], '/api/activity-log');

  const logActivity = useCallback(async (message: string, user: string, category: ActivityLogCategory) => {
    // FIX: Add validation to prevent requests with invalid bodies
    if (!message || !user || !category) {
      console.error('logActivity called with invalid arguments:', { message, user, category });
      return;
    }

    const newLogEntry: Omit<ActivityLog, 'id'> = {
      timestamp: new Date().toISOString(),
      user: user || 'System',
      message: message,
      category: category,
    };
    
    try {
        const response = await fetch('/api/activity-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLogEntry),
        });

        if (response.ok) {
          const savedLog = await response.json();
          setLogs(prev => [savedLog, ...prev]);
        } else {
            throw new Error('Failed to save activity log');
        }
    } catch (error) {
        console.error("Failed to log activity to API:", error);
    }
  }, [setLogs]);

  const clearLogs = useCallback(async () => {
    try {
        const response = await fetch('/api/activity-log', { method: 'DELETE' });
        if(response.ok) {
            setLogs([]);
            logActivity('Cleared all activity logs.', 'System', 'System');
        } else {
            throw new Error('Failed to clear activity logs on server.');
        }
    } catch(error) {
        console.error("Failed to clear logs:", error);
    }
  }, [setLogs, logActivity]);

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
