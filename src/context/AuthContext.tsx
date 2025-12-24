
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, UserRole } from '@/lib/types';
import { useActivityLog } from './ActivityLogContext';

// Define the shape of the context
interface AuthContextType {
  user: User | null;
  users: User[];
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
  addUser: (username: string, password: string, role: UserRole, branchId?: string) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string, username: string) => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Hardcoded Root User ---
const rootUser: User = {
  id: 'root-user',
  username: 'root',
  password: 'Faith123$$',
  role: 'root',
};

const USERS_STORAGE_KEY = 'cheeziousUsers';
const SESSION_STORAGE_KEY = 'cheeziousSession';

// Create the provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([rootUser]);
  const [isLoading, setIsLoading] = useState(true);
  const { logActivity } = useActivityLog();
  const router = useRouter();

  // Load users from localStorage on initial render
  useEffect(() => {
    setIsLoading(true);
    try {
      const storedUsersJSON = localStorage.getItem(USERS_STORAGE_KEY);
      let loadedUsers: User[] = [];
      if (storedUsersJSON) {
        loadedUsers = JSON.parse(storedUsersJSON);
      }

      // Ensure root user is always present and has the correct password
      const rootUserInStorage = loadedUsers.find(u => u.id === rootUser.id);
      if (!rootUserInStorage) {
        // If root user isn't in storage, add it.
        setUsers([rootUser, ...loadedUsers]);
      } else {
        // If root user is in storage, ensure its password is correct.
        const otherUsers = loadedUsers.filter(u => u.id !== rootUser.id);
        setUsers([rootUser, ...otherUsers]);
      }

      const sessionUser = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if(sessionUser) {
        setUser(JSON.parse(sessionUser));
      }
    } catch (error) {
      console.error("Failed to initialize auth state:", error);
      setUsers([rootUser]); // Reset to default if storage is corrupt
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Persist users to localStorage whenever they change
  useEffect(() => {
    if (isLoading) return;
    try {
        // We need to re-add passwords for non-root users before login checks,
        // but don't store them in localStorage. Let's find a way to manage this.
        // For now, this just saves users without passwords.
        const usersToStore = users.map(u => {
            const { password, ...userToStore } = u;
            // Never store the root user's password in localStorage
            if (userToStore.id === 'root-user') {
                return userToStore;
            }
            return userToStore;
        });
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersToStore));
    } catch (error) {
      console.error("Could not save users to local storage", error);
    }
  }, [users, isLoading]);
  
  // Persist current user to sessionStorage
  useEffect(() => {
      if (isLoading) return;
      try {
          if (user) {
              sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
          } else {
              sessionStorage.removeItem(SESSION_STORAGE_KEY);
          }
      } catch (error) {
          console.error("Could not save session to session storage", error);
      }
  }, [user, isLoading]);

  const login = useCallback(async (username: string, password: string): Promise<User | null> => {
    const foundUser = users.find(u => u.username === username && u.password === password);
    if (foundUser) {
      setUser(foundUser);
      logActivity(`User '${username}' logged in.`);
      return foundUser;
    }
    throw new Error('Invalid username or password');
  }, [users, logActivity]);

  const logout = useCallback(() => {
    logActivity(`User '${user?.username}' logged out.`);
    setUser(null);
    router.push('/login');
  }, [router, user, logActivity]);

  const addUser = useCallback((username: string, password: string, role: UserRole, branchId?: string) => {
    if (users.some(u => u.username === username)) {
      alert('Username already exists.');
      return;
    }
    const newUser: User = { id: crypto.randomUUID(), username, password, role, branchId };
    setUsers(prev => [...prev, newUser]);
    logActivity(`Added new user: '${username}' with role '${role}'.`);
  }, [users, logActivity]);

  const updateUser = useCallback((updatedUser: User) => {
    setUsers(prev => prev.map(u => {
        if (u.id === updatedUser.id) {
            // Keep the old password if the new one is not provided
            const newPassword = updatedUser.password ? updatedUser.password : u.password;
            return { ...updatedUser, password: newPassword };
        }
        return u;
    }));
    logActivity(`Updated user details for: '${updatedUser.username}'.`);
  }, [logActivity]);

  const deleteUser = useCallback((id: string, username: string) => {
    if (id === rootUser.id) {
        alert("Cannot delete the root user.");
        return;
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    logActivity(`Deleted user: '${username}'.`);
  }, [logActivity]);

  const value = { user, users, isLoading, login, logout, addUser, updateUser, deleteUser };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Create a custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
