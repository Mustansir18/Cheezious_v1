

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
  addUser: (user: Omit<User, 'id' | 'balance'>, id: string) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string, name: string) => Promise<void>;
  updateUserBalance: (userId: string, amount: number, operation: 'add' | 'subtract') => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_ID_KEY = 'cheezious_session_id';
const USERS_STORAGE_KEY = 'cheeziousUsersV2';

const initialUsers: User[] = [
    { id: 'root', username: 'root', password: 'Faith123$$', role: 'root', balance: 0 },
    { id: 'admin-1', username: 'admin', password: '123', role: 'admin', branchId: 'B-00001', balance: 0 },
    { id: 'cashier-1', username: 'cashier', password: '123', role: 'cashier', branchId: 'B-00001', balance: 0 },
    { id: 'kds-master', username: 'kds', password: '123', role: 'kds', branchId: 'B-00001', balance: 0 },
];

// Create the provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { logActivity } = useActivityLog();
  const { toast } = useToast();
  const router = useRouter();

  // Load users from storage or initialize on mount
  useEffect(() => {
    try {
      const localUsers = localStorage.getItem(USERS_STORAGE_KEY);
      if (localUsers && JSON.parse(localUsers).length > 0) {
        setUsers(JSON.parse(localUsers));
      } else {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
        setUsers(initialUsers);
      }
    } catch (error) {
      console.error("Failed to load users from localStorage, using defaults:", error);
      setUsers(initialUsers);
    }
  }, []);


  // Load session on initial render
  useEffect(() => {
    setIsLoading(true);
    try {
        const sessionId = localStorage.getItem(SESSION_ID_KEY);
        if (sessionId) {
            const sessionUser = sessionStorage.getItem(`session_${sessionId}`);
            if (sessionUser) {
                setUser(JSON.parse(sessionUser));
            }
        }
    } catch (error) {
        console.error("Failed to load user from session storage:", error);
    } finally {
        setIsLoading(false);
    }
  }, []);


  const login = useCallback(async (username: string, password: string): Promise<User | null> => {
    // This now correctly checks the state `users` which is populated from localStorage
    const foundUser = users.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (foundUser) {
        const sessionId = uuidv4();
        localStorage.setItem(SESSION_ID_KEY, sessionId);
        sessionStorage.setItem(`session_${sessionId}`, JSON.stringify(foundUser));
        setUser(foundUser);
        logActivity(`User '${username}' logged in.`, username, 'System');
        return foundUser;
    } else {
        throw new Error('Invalid username or password.');
    }
  }, [users, logActivity]);

  const logout = useCallback(async () => {
    const sessionId = localStorage.getItem(SESSION_ID_KEY);
    if (user && sessionId) {
        logActivity(`User '${user.username}' logged out.`, user.username, 'System');
        sessionStorage.removeItem(`session_${sessionId}`);
    }
    setUser(null);
    localStorage.removeItem(SESSION_ID_KEY);
    router.push('/login');
  }, [router, user, logActivity]);


  const saveUsers = (newUsers: User[]) => {
      setUsers(newUsers);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newUsers));
  }

  const addUser = async (newUser: Omit<User, 'id' | 'balance'>, id: string) => {
    const userExists = users.some(u => u.id === id || u.username.toLowerCase() === newUser.username.toLowerCase());
    if (userExists) {
        toast({ variant: 'destructive', title: 'Error', description: 'A user with this ID or username already exists.' });
        return;
    }
    const userToAdd: User = { id, ...newUser, balance: 0 };
    saveUsers([...users, userToAdd]);
    logActivity(`Added new user '${newUser.username}'.`, user?.username || 'System', 'User');
    toast({ title: 'Success', description: 'User has been created.' });
  };

  const updateUser = async (updatedUser: User) => {
     const newUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
     saveUsers(newUsers);
     if(user?.id === updatedUser.id) {
         setUser(updatedUser);
     }
     logActivity(`Updated user '${updatedUser.username}'.`, user?.username || "System", 'User');
     toast({ title: 'Success', description: 'User has been updated.' });
  };

  const deleteUser = async (id: string, name: string) => {
    saveUsers(users.filter(u => u.id !== id));
    logActivity(`Deleted user '${name}'.`, user?.username || "System", 'User');
    toast({ title: 'Success', description: 'User has been deleted.' });
  };

  const updateUserBalance = useCallback((userId: string, amount: number, operation: 'add' | 'subtract') => {
      setUsers(prevUsers => {
          const newUsers = prevUsers.map(u => {
              if (u.id === userId) {
                  const currentBalance = u.balance || 0;
                  const newBalance = operation === 'add' ? currentBalance + amount : currentBalance - amount;
                  return { ...u, balance: newBalance };
              }
              return u;
          });
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newUsers));
          return newUsers;
      });
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
