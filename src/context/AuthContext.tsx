
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

const SESSION_ID_KEY = 'cheezious_session_id'; // This is for browser session, not DB session
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
    async function loadUsers() {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        
        let currentUsers = data.users || [];
        
        // Ensure root user exists
        const rootExists = currentUsers.some((u: User) => u.username === 'root');
        if (!rootExists) {
            console.log("Root user not found in DB, attempting to create...");
            try {
                const rootUser = initialUsers.find(u => u.id === 'root')!;
                const createResponse = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user: { ...rootUser, password: 'Faith123$$' }, id: 'root' }),
                });
                if (createResponse.ok) {
                    const { user: createdRoot } = await createResponse.json();
                    currentUsers.push(createdRoot);
                    console.log("Root user created successfully.");
                } else {
                     const errorData = await createResponse.json();
                     // If it already exists (race condition), just fetch again
                     if (errorData.message.includes('already exists')) {
                        const freshUsers = await (await fetch('/api/users')).json();
                        currentUsers = freshUsers.users || [];
                     } else {
                        throw new Error('Failed to create root user.');
                     }
                }
            } catch (e) {
                console.error("Failed to create root user:", e);
            }
        }
        setUsers(currentUsers);

      } catch (error) {
        console.warn('Error fetching users from API:', error);
        // Fallback to local storage if API fails, useful for offline dev
        const localUsers = localStorage.getItem(USERS_STORAGE_KEY);
        setUsers(localUsers ? JSON.parse(localUsers) : initialUsers);
      }
    }

    loadUsers();
  }, []);


  // Load session on initial render
  useEffect(() => {
    async function loadSession() {
      setIsLoading(true);
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
                localStorage.removeItem(SESSION_ID_KEY);
            }
          } catch (e) {
            console.error("Failed to validate session, logging out.", e);
            localStorage.removeItem(SESSION_ID_KEY);
          }
      }
      setIsLoading(false);
    }
    loadSession();
  }, []);


  const login = useCallback(async (username: string, password: string): Promise<User | null> => {
    const guestSessionId = localStorage.getItem(SESSION_ID_KEY);

    const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, guestSessionId }),
    });

    if (response.ok) {
        const { user: loggedInUser, sessionId: newSessionId } = await response.json();
        setUser(loggedInUser);
        localStorage.setItem(SESSION_ID_KEY, newSessionId);
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
        await fetch('/api/auth/session', {
            method: 'DELETE',
            headers: { 'x-session-id': sessionId }
        });
    }
    setUser(null);
    localStorage.removeItem(SESSION_ID_KEY);
    
    // Create a new guest session ID
    const newGuestSessionId = uuidv4();
    localStorage.setItem(SESSION_ID_KEY, newGuestSessionId);

    router.push('/login');
  }, [router, user, logActivity]);


  const addUser = async (newUser: Omit<User, 'id' | 'balance'>, id: string) => {
    const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: newUser, id }),
    });

    if (response.ok) {
        const { user: createdUser } = await response.json();
        setUsers(prev => [...prev, createdUser]);
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
        body: JSON.stringify({ user: updatedUser }),
     });
     if (response.ok) {
        const { user: savedUser } = await response.json();
        setUsers(prev => prev.map(u => u.id === savedUser.id ? savedUser : u));
        if(user?.id === savedUser.id) {
            setUser(savedUser);
        }
        logActivity(`Updated user '${savedUser.username}'.`, user?.username || "System", 'User');
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
        body: JSON.stringify({ id, name }),
    });
    if(response.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
        logActivity(`Deleted user '${name}'.`, user?.username || "System", 'User');
        toast({ title: 'Success', description: 'User has been deleted.' });
    } else {
        const errorData = await response.json();
        toast({ variant: 'destructive', title: 'Error', description: errorData.message });
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
