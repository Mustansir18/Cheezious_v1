
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, UserRole } from '@/lib/types';
import { useActivityLog } from './ActivityLogContext';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

// Define the shape of the context
interface AuthContextType {
  user: User | null;
  users: User[];
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
  addUser: (user: Omit<User, 'id' | 'balance'>) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateUserBalance: (userId: string, amount: number, operation: 'add' | 'subtract') => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_ID_KEY = 'cheezious_session_id';

// Create the provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { logActivity } = useActivityLog();
  const { toast } = useToast();
  const router = useRouter();

  // Load users from API and session on initial render
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      
      const loadUsers = async () => {
        try {
          const response = await fetch('/api/users');
          if (!response.ok) throw new Error('Failed to fetch users');
          const data = await response.json();
          setUsers(data.users || []);
          return data.users || [];
        } catch (error) {
          console.error("Failed to fetch users:", error);
          toast({ variant: 'destructive', title: 'User Sync Error', description: 'Could not load user accounts.' });
          return [];
        }
      };
      
      const loadSession = async (allUsers: User[]) => {
          const sessionId = localStorage.getItem(SESSION_ID_KEY);
          if (sessionId) {
              try {
                  const response = await fetch('/api/auth/session', {
                      headers: { 'x-session-id': sessionId }
                  });
                  if(response.ok) {
                      const { user: sessionUser } = await response.json();
                      if (sessionUser) {
                          setUser(sessionUser);
                      }
                  } else {
                      localStorage.removeItem(SESSION_ID_KEY);
                  }
              } catch (error) {
                  console.error('Session validation failed', error);
                  localStorage.removeItem(SESSION_ID_KEY);
              }
          }
      };
      
      const allUsers = await loadUsers();
      await loadSession(allUsers);
      setIsLoading(false);
    }
    loadInitialData();
  }, [toast]);


  const login = useCallback(async (username: string, password: string): Promise<User | null> => {
    try {
        const response = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const { message } = await response.json();
            throw new Error(message || 'Login failed');
        }

        const { user: loggedInUser, sessionId } = await response.json();
        setUser(loggedInUser);
        localStorage.setItem(SESSION_ID_KEY, sessionId);
        logActivity(`User '${username}' logged in.`, username, 'System');
        return loggedInUser;
    } catch (error: any) {
        throw new Error(error.message);
    }
  }, [logActivity]);

  const logout = useCallback(async () => {
    const sessionId = localStorage.getItem(SESSION_ID_KEY);
    if (user && sessionId) {
        logActivity(`User '${user.username}' logged out.`, user.username, 'System');
        try {
            await fetch('/api/auth/session', {
                method: 'DELETE',
                headers: { 'x-session-id': sessionId }
            });
        } catch (error) {
            console.error('Failed to clear session on server', error);
        }
    }
    setUser(null);
    localStorage.removeItem(SESSION_ID_KEY);
    router.push('/login');
  }, [router, user, logActivity]);

  const addUser = async (newUser: Omit<User, 'id' | 'balance'>) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message || 'Failed to add user');
      }

      const savedUser = await response.json();
      setUsers(prev => [...prev, savedUser]);
      logActivity(`Added new user '${newUser.username}'.`, user?.username || 'System', 'User');
      toast({ title: 'Success', description: 'User has been created.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const updateUser = async (updatedUser: User) => {
     try {
      const response = await fetch(`/api/users`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message || 'Failed to update user');
      }

      const returnedUser = await response.json();
      setUsers(prev => prev.map(u => u.id === returnedUser.id ? returnedUser : u));
      logActivity(`Updated user '${returnedUser.username}'.`, user?.username || "System", 'User');
      toast({ title: 'Success', description: 'User has been updated.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const deleteUser = async (id: string) => {
     try {
      const response = await fetch(`/api/users`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message || 'Failed to delete user');
      }
      const { username } = await response.json();
      setUsers(prev => prev.filter(u => u.id !== id));
      logActivity(`Deleted user '${username}'.`, user?.username || "System", 'User');
      toast({ title: 'Success', description: 'User has been deleted.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const updateUserBalance = useCallback((userId: string, amount: number, operation: 'add' | 'subtract') => {
      setUsers(prevUsers => prevUsers.map(u => {
          if (u.id === userId) {
              const currentBalance = u.balance || 0;
              const newBalance = operation === 'add' ? currentBalance + amount : currentBalance - amount;
              return { ...u, balance: newBalance };
          }
          return u;
      }));
  }, []);


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
