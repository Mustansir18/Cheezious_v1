
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Rating } from '@/lib/types';
import { useActivityLog } from './ActivityLogContext';

interface RatingContextType {
  ratings: Rating[];
  isLoading: boolean;
  addRating: (rating: Omit<Rating, 'id' | 'timestamp'>) => void;
  clearRatings: () => void;
}

const RatingContext = createContext<RatingContextType | undefined>(undefined);

export const RatingProvider = ({ children }: { children: ReactNode }) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { logActivity } = useActivityLog();

  useEffect(() => {
    async function loadRatings() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/ratings');
        if (!response.ok) throw new Error('Failed to fetch ratings');
        const data = await response.json();
        setRatings(data.ratings || []);
      } catch (error) {
        console.error("Could not load ratings from API", error);
        setRatings([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadRatings();
  }, []);

  const addRating = useCallback(async (newRatingData: Omit<Rating, 'id' | 'timestamp'>) => {
    const tempRating = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...newRatingData,
    };
    
    // In a real app, this would be a POST request to /api/ratings
    setRatings((prevRatings) => [tempRating, ...prevRatings]);
    logActivity(`New ${tempRating.rating}-star rating received.`, 'Customer', 'System');
  }, [logActivity]);

  const clearRatings = useCallback(async () => {
    // In a real app, this would be a DELETE request to /api/ratings
    setRatings([]);
    logActivity('Cleared all customer ratings.', 'System', 'System');
  }, [logActivity]);

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
