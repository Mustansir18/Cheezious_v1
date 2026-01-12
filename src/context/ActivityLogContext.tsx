
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

export const ActivityLogProvider = ({ children }: { children: ReactNode }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load logs from API on initial render
  useEffect(() => {
    async function loadLogs() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/activity-log');
        if (!response.ok) throw new Error('Failed to fetch activity logs');
        const data = await response.json();
        setLogs(data.logs || []);
      } catch (error) {
        console.error("Could not load activity logs from API", error);
        setLogs([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadLogs();
  }, []);

  const logActivity = useCallback(async (message: string, user: string, category: ActivityLogCategory) => {
    const newLog: Omit<ActivityLog, 'id'> = {
      timestamp: new Date().toISOString(),
      user: user || 'System',
      message: message,
      category: category,
    };
    
    try {
        const response = await fetch('/api/activity-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLog),
        });

        if (response.ok) {
          const savedLog = await response.json();
          setLogs(prev => [savedLog, ...prev]);
        } else {
            throw new Error('Failed to save activity log');
        }
    } catch (error) {
        console.error("Failed to log activity to API:", error);
        // Optionally add to state anyway for UI feedback, but mark as unsaved
    }
  }, []);

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
