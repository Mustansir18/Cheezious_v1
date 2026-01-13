
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { ActivityLog, ActivityLogCategory } from '@/lib/types';
import { useDataFetcher } from '@/hooks/use-data-fetcher';

interface ActivityLogContextType {
  logs: ActivityLog[];
  isLoading: boolean;
  logActivity: (message: string, user: string, category: ActivityLogCategory) => void;
  clearLogs: () => void;
}

const ActivityLogContext = createContext<ActivityLogContextType | undefined>(undefined);

export const ActivityLogProvider = ({ children }: { children: ReactNode }) => {
  const { data: logs, isLoading, mutate } = useDataFetcher<ActivityLog[]>('/api/activity-log', []);

  const logActivity = useCallback(async (message: string, user: string, category: ActivityLogCategory) => {
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
          mutate(); // Re-fetch the logs to include the new one
        } else {
            throw new Error('Failed to save activity log');
        }
    } catch (error) {
        console.error("Failed to log activity to API:", error);
    }
  }, [mutate]);

  const clearLogs = useCallback(async () => {
    try {
        const response = await fetch('/api/activity-log', { method: 'DELETE' });
        if(response.ok) {
            mutate(); // Re-fetch to get the empty list
            logActivity('Cleared all activity logs.', 'System', 'System');
        } else {
            throw new Error('Failed to clear activity logs on server.');
        }
    } catch(error) {
        console.error("Failed to clear logs:", error);
    }
  }, [mutate, logActivity]);

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
