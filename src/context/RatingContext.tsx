
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { Rating } from '@/lib/types';
import { useActivityLog } from './ActivityLogContext';
import { useSyncLocalStorage } from '@/hooks/use-sync-local-storage';

interface RatingContextType {
  ratings: Rating[];
  isLoading: boolean;
  addRating: (rating: Omit<Rating, 'id' | 'timestamp'>) => void;
  clearRatings: () => void;
}

const RatingContext = createContext<RatingContextType | undefined>(undefined);

const RATINGS_STORAGE_KEY = 'cheeziousRatingsV2';

export const RatingProvider = ({ children }: { children: ReactNode }) => {
  const [ratings, setRatings, isLoading] = useSyncLocalStorage<Rating[]>(RATINGS_STORAGE_KEY, [], '/api/ratings');
  const { logActivity } = useActivityLog();

  const addRating = useCallback(async (newRatingData: Omit<Rating, 'id' | 'timestamp'>) => {
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRatingData),
      });
      if (!response.ok) throw new Error('Failed to submit rating');
      const savedRating = await response.json();
      setRatings((prev) => [savedRating, ...prev]);
      logActivity(`New ${savedRating.rating}-star rating received.`, 'Customer', 'System');
    } catch (error) {
      console.error('Failed to add rating:', error);
    }
  }, [setRatings, logActivity]);

  const clearRatings = useCallback(async () => {
    try {
      await fetch('/api/ratings', { method: 'DELETE' });
      setRatings([]);
      logActivity('Cleared all customer ratings.', 'System', 'System');
    } catch (error) {
       console.error('Failed to clear ratings:', error);
    }
  }, [setRatings, logActivity]);

  return (
    <RatingContext.Provider
      value={{
        ratings,
        isLoading,
        addRating,
        clearRatings,
      }}
    >
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
