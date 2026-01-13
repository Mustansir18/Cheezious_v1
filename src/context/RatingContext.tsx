
"use client";

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import type { Rating } from '@/lib/types';
import { useActivityLog } from './ActivityLogContext';
import { useDataFetcher } from '@/hooks/use-data-fetcher';
import { useAuth } from './AuthContext';

interface RatingContextType {
  ratings: Rating[];
  isLoading: boolean;
  addRating: (rating: Omit<Rating, 'id' | 'timestamp'>) => void;
  clearRatings: () => void;
}

const RatingContext = createContext<RatingContextType | undefined>(undefined);

export const RatingProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth(); // Use auth context to check for logged-in user
  const { data: ratings, isLoading, mutate } = useDataFetcher<Rating[]>(user ? '/api/ratings' : null, []);
  const { logActivity } = useActivityLog();

  const addRating = useCallback(async (newRatingData: Omit<Rating, 'id' | 'timestamp'>) => {
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRatingData),
      });
      if (!response.ok) throw new Error('Failed to submit rating');
      
      if (user) {
        mutate(); // Re-fetch ratings only if a user is logged in
      }
      logActivity(`New ${newRatingData.rating}-star rating received.`, 'Customer', 'System');
    } catch (error) {
      console.error('Failed to add rating:', error);
    }
  }, [mutate, logActivity, user]);

  const clearRatings = useCallback(async () => {
    try {
      await fetch('/api/ratings', { method: 'DELETE' });
      if (user) {
        mutate(); // Re-fetch to get the empty list
      }
      logActivity('Cleared all customer ratings.', 'System', 'System');
    } catch (error) {
       console.error('Failed to clear ratings:', error);
    }
  }, [mutate, logActivity, user]);

  return (
    <RatingContext.Provider value={{ ratings: ratings || [], isLoading, addRating, clearRatings }}>
      {children}
    </RatingContext.Provider>
  );
};

export const useRating = () => {
  const context = useContext(RatingContext);
  if (context === undefined) {
    throw new Error('useRating must be used within a RatingProvider');
  }
  return context;
};
