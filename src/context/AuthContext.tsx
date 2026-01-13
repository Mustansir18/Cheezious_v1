
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, UserRole } from '@/lib/types';
import { useActivityLog } from './ActivityLogContext';
import { useToast } from '@/hooks/use-toast';
import { useDataFetcher } from '@/hooks/use-data-fetcher';
import { mutate as globalMutate } from 'swr';

interface AuthContextType {
  user: User | null;
  users: User[];
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
  addUser: (user: Omit<User, 'id' | 'balance'>, id: string) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string, name: string) => Promise<void>;
  updateUserBalance: (userId: string, amount: number, operation: 'add' | 'subtract') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SESSION_ID_KEY = 'cheezious_session_id';

const initialUsers: User[] = [
    { id: 'CH-00001', username: 'root', password: 'Faith123$$', role: 'root', balance: 100000 },
    { id: 'CH-00002', username: 'admin', password: 'admin', role: 'admin', branchId: 'B-00001', balance: 50000 },
    { id: 'CH-00003', username: 'cashier', password: '123', role: 'cashier', branchId: 'B-00001', balance: 10000 },
    { id: 'CH-00004', username: 'marketing', password: 'marketing', role: 'marketing', balance: 0 },
    { id: 'CH-00005', username: 'kds', password: 'kds', role: 'kds', branchId: 'B-00001', stationName: 'All Stations' },
    { id: 'CH-00006', username: 'make-station', password: 'make-station', role: 'make-station', branchId: 'B-00001', stationName: 'MAKE Station' },
    { id: 'CH-00007', username: 'pasta-station', password: 'pasta-station', role: 'pasta-station', branchId: 'B-00001', stationName: 'PASTA Station' },
    { id: 'CH-00008', username: 'fried-station', password: 'fried-station', role: 'fried-station', branchId: 'B-00001', stationName: 'FRIED Station' },
    { id: 'CH-00009', username: 'bar-station', password: 'bar-station', role: 'bar-station', branchId: 'B-00001', stationName: 'BEVERAGES Station' },
    { id: 'CH-00010', username: 'cutt-station', password: 'cutt-station', role: 'cutt-station', branchId: 'B-00001', stationName: 'CUTT Station' },
];

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const { data: users, isLoading: isUsersLoading, mutate: mutateUsers } = useDataFetcher<User[]>('/api/users', initialUsers);
  const [isSessionLoading, setSessionLoading] = useState(true);
  const { logActivity } = useActivityLog();
  const { toast } = useToast();
  const router = useRouter();

  const isLoading = isUsersLoading || isSessionLoading;

  useEffect(() => {
    async function fetchSession() {
      setSessionLoading(true);
      const sessionId = localStorage.getItem(SESSION_ID_KEY);
      if (sessionId) {
        try {
          const response = await fetch('/api/auth/session', { headers: { 'x-session-id': sessionId } });
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            localStorage.removeItem(SESSION_ID_KEY);
            setUser(null);
          }
        } catch (error) {
          console.error("Failed to fetch session:", error);
          setUser(null);
        }
      }
      setSessionLoading(false);
    }
    fetchSession();
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<User | null> => {
    const guestSessionId = localStorage.getItem(SESSION_ID_KEY);
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, guestSessionId })
    });

    if (response.ok) {
      const { user: loggedInUser, sessionId } = await response.json();
      localStorage.setItem(SESSION_ID_KEY, sessionId);
      setUser(loggedInUser);
      logActivity(`User '${username}' logged in.`, username, 'System');
      // Trigger a re-fetch of cart data, which might now belong to the user
      globalMutate('/api/cart');
      return loggedInUser;
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Invalid username or password.');
    }
  }, [logActivity]);

  const logout = useCallback(async () => {
    const sessionId = localStorage.getItem(SESSION_ID_KEY);
    if (user && sessionId) {
      logActivity(`User '${user.username}' logged out.`, user.username, 'System');
      await fetch('/api/auth/session', { method: 'DELETE', headers: { 'x-session-id': sessionId } });
    }
    setUser(null);
    localStorage.removeItem(SESSION_ID_KEY);
    // Clear cart data from other contexts if necessary (though SWR should handle this)
    globalMutate('/api/cart', { cart: null, items: [] }, false); // Optimistically update cart to be empty
    router.push('/login');
  }, [router, user, logActivity]);

  const postUserData = async (method: 'POST' | 'PUT' | 'DELETE', body: any) => {
    const response = await fetch('/api/users', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message);
    }
    mutateUsers(); // Re-fetch the user list
  };

  const addUser = async (newUser: Omit<User, 'id' | 'balance'>, id: string) => {
    try {
      await postUserData('POST', { user: newUser, id });
      logActivity(`Added new user '${newUser.username}'.`, user?.username || 'System', 'User');
      toast({ title: 'Success', description: 'User has been created.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const updateUser = async (updatedUser: User) => {
    try {
      await postUserData('PUT', { user: updatedUser });
      if (user?.id === updatedUser.id) setUser(updatedUser);
      logActivity(`Updated user '${updatedUser.username}'.`, user?.username || "System", 'User');
      toast({ title: 'Success', description: 'User has been updated.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const deleteUser = async (id: string, name: string) => {
    try {
      await postUserData('DELETE', { id, name });
      logActivity(`Deleted user '${name}'.`, user?.username || "System", 'User');
      toast({ title: 'Success', description: 'User has been deleted.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const updateUserBalance = useCallback((userId: string, amount: number, operation: 'add' | 'subtract') => {
    mutateUsers((currentUsers: User[] | undefined) => {
        if (!currentUsers) return [];
        const updatedUsers = currentUsers.map((u: User) => {
            if (u.id === userId) {
                const currentBalance = u.balance || 0;
                const newBalance = operation === 'add' ? currentBalance + amount : currentBalance - amount;
                return { ...u, balance: newBalance };
            }
            return u;
        });
        return { users: updatedUsers };
    }, false); // optimistic update
  }, [mutateUsers]);

  const value = { user, users: users || [], isLoading, login, logout, addUser, updateUser, deleteUser, updateUserBalance };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const AuthContextWrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
);

export { AuthContextWrapper as AuthProvider };


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
