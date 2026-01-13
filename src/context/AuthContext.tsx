

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
      const item = window.localStorage.getItem(USERS_STORAGE_KEY);
      const storedUsers = item ? JSON.parse(item) : null;
      
      if (storedUsers && storedUsers.length > 0) {
        setUsers(storedUsers);
      } else {
        // If no users in local storage, initialize with defaults
        setUsers(initialUsers);
        window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
      }
    } catch (error) {
      console.warn('Error with user storage:', error);
      setUsers(initialUsers);
    }
  }, []);


  // Load session on initial render
  useEffect(() => {
    async function loadSession() {
      setIsLoading(true);
      const sessionId = localStorage.getItem(SESSION_ID_KEY);
      if (sessionId) {
          const sessionUser = users.find(u => u.id === sessionId);
          if(sessionUser) {
              setUser(sessionUser);
          } else {
              localStorage.removeItem(SESSION_ID_KEY);
          }
      }
      setIsLoading(false);
    }
    if (users.length > 0) {
        loadSession();
    }
  }, [users]);


  const login = useCallback(async (username: string, password: string): Promise<User | null> => {
    const foundUser = users.find(u => u.username === username && u.password === password);
    
    if (foundUser) {
        setUser(foundUser);
        localStorage.setItem(SESSION_ID_KEY, foundUser.id);
        logActivity(`User '${username}' logged in.`, username, 'System');
        return foundUser;
    } else {
        throw new Error('Invalid username or password.');
    }
  }, [users, logActivity]);

  const logout = useCallback(async () => {
    if (user) {
        logActivity(`User '${user.username}' logged out.`, user.username, 'System');
    }
    setUser(null);
    localStorage.removeItem(SESSION_ID_KEY);
    router.push('/login');
  }, [router, user, logActivity]);

  const postUsers = (newUsers: User[]) => {
      try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newUsers));
        setUsers(newUsers);
      } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not save user data.' });
      }
  }

  const addUser = async (newUser: Omit<User, 'id' | 'balance'>, id: string) => {
    const fullUser: User = { ...newUser, id, balance: 0 };
    postUsers([...users, fullUser]);
    logActivity(`Added new user '${newUser.username}'.`, user?.username || 'System', 'User');
    toast({ title: 'Success', description: 'User has been created.' });
  };

  const updateUser = async (updatedUser: User) => {
     const newUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
     postUsers(newUsers);
     if(user?.id === updatedUser.id) {
         setUser(updatedUser);
     }
     logActivity(`Updated user '${updatedUser.username}'.`, user?.username || "System", 'User');
     toast({ title: 'Success', description: 'User has been updated.' });
  };

  const deleteUser = async (id: string, name: string) => {
    const newUsers = users.filter(u => u.id !== id);
    postUsers(newUsers);
    logActivity(`Deleted user '${name}'.`, user?.username || "System", 'User');
    toast({ title: 'Success', description: 'User has been deleted.' });
  };

  const updateUserBalance = useCallback((userId: string, amount: number, operation: 'add' | 'subtract') => {
      const newUsers = users.map(u => {
          if (u.id === userId) {
              const currentBalance = u.balance || 0;
              const newBalance = operation === 'add' ? currentBalance + amount : currentBalance - amount;
              return { ...u, balance: newBalance };
          }
          return u;
      });
      postUsers(newUsers);
  }, [users, postUsers]);


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
