
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, UserRole } from '@/lib/types';
import { useActivityLog } from './ActivityLogContext';
import { useToast } from '@/hooks/use-toast';
import { useSyncLocalStorage } from '@/hooks/use-sync-local-storage';

// Define the shape of the context
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

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_ID_KEY = 'cheezious_session_id';

const initialUsers: User[] = [
    { id: 'root', username: 'root', password: 'Faith123$$', role: 'root', balance: 0 },
    { id: 'admin-1', username: 'admin', password: '123', role: 'admin', branchId: 'B-00001', balance: 0 },
    { id: 'cashier-1', username: 'cashier', password: '123', role: 'cashier', branchId: 'B-00001', balance: 0 },
    { id: 'marketing-1', username: 'marketing', password: '123', role: 'marketing', balance: 0 },
    { id: 'kds-master', username: 'kds', password: '123', role: 'kds', branchId: 'B-00001', balance: 0 },
    { id: 'kds-make', username: 'pizza', password: '123', role: 'make-station', branchId: 'B-00001', stationName: 'MAKE Station', balance: 0 },
    { id: 'kds-pasta', username: 'pasta', password: '123', role: 'pasta-station', branchId: 'B-00001', stationName: 'PASTA Station', balance: 0 },
    { id: 'kds-fried', username: 'fried', password: '123', role: 'fried-station', branchId: 'B-00001', stationName: 'FRIED Station', balance: 0 },
    { id: 'kds-bar', username: 'bar', password: '123', role: 'bar-station', branchId: 'B-00001', stationName: 'BEVERAGES Station', balance: 0 },
    { id: 'kds-cutt', username: 'cutt', password: '123', role: 'cutt-station', branchId: 'B-00001', stationName: 'CUTT Station', balance: 0 },
];

// Create the provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers, isUsersLoading] = useSyncLocalStorage<User[]>('users', initialUsers, '/api/users');
  const [isSessionLoading, setSessionLoading] = useState(true);
  const { logActivity } = useActivityLog();
  const { toast } = useToast();
  const router = useRouter();

  const isLoading = isUsersLoading || isSessionLoading;

  // Load session from API on initial render
  useEffect(() => {
    async function fetchSession() {
      setSessionLoading(true);
      const sessionId = localStorage.getItem(SESSION_ID_KEY);
      if (sessionId) {
        try {
          const response = await fetch('/api/auth/session', {
            headers: { 'x-session-id': sessionId }
          });
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            // Session is invalid, clear it
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
    router.push('/login');
  }, [router, user, logActivity]);


  const addUser = async (newUser: Omit<User, 'id' | 'balance'>, id: string) => {
    const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: newUser, id })
    });

    if (response.ok) {
        const { user: createdUser } = await response.json();
        setUsers([...users, createdUser]);
        logActivity(`Added new user '${newUser.username}'.`, user?.username || 'System', 'User');
        toast({ title: 'Success', description: 'User has been created.' });
    } else {
        const errorData = await response.json();
        toast({ variant: 'destructive', title: 'Error', description: errorData.message });
    }
  };

  const updateUser = async (updatedUser: User) => {
    const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: updatedUser })
    });

    if(response.ok) {
        setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
        if(user?.id === updatedUser.id) {
            setUser(updatedUser);
        }
        logActivity(`Updated user '${updatedUser.username}'.`, user?.username || "System", 'User');
        toast({ title: 'Success', description: 'User has been updated.' });
    } else {
         const errorData = await response.json();
         toast({ variant: 'destructive', title: 'Error', description: errorData.message });
    }
  };

  const deleteUser = async (id: string, name: string) => {
    const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name })
    });

    if(response.ok) {
        setUsers(users.filter(u => u.id !== id));
        logActivity(`Deleted user '${name}'.`, user?.username || "System", 'User');
        toast({ title: 'Success', description: 'User has been deleted.' });
    } else {
        const errorData = await response.json();
        toast({ variant: 'destructive', title: 'Error', description: errorData.message });
    }
  };

  const updateUserBalance = useCallback((userId: string, amount: number, operation: 'add' | 'subtract') => {
      setUsers(prevUsers => {
          return prevUsers.map(u => {
              if (u.id === userId) {
                  const currentBalance = u.balance || 0;
                  const newBalance = operation === 'add' ? currentBalance + amount : currentBalance - amount;
                  return { ...u, balance: newBalance };
              }
              return u;
          });
      });
  }, [setUsers]);


  const value = { user, users, isLoading, login, logout, addUser, updateUser, deleteUser, updateUserBalance };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
