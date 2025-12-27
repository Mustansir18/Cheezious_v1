
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

const RATING_STORAGE_KEY = 'cheeziousRatings';

export const RatingProvider = ({ children }: { children: ReactNode }) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { logActivity } = useActivityLog();

  useEffect(() => {
    try {
      const storedRatings = localStorage.getItem(RATING_STORAGE_KEY);
      if (storedRatings) {
        setRatings(JSON.parse(storedRatings));
      }
    } catch (error) {
      console.error("Could not load ratings from local storage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      if (!isLoading) {
        localStorage.setItem(RATING_STORAGE_KEY, JSON.stringify(ratings));
      }
    } catch (error) {
      console.error("Could not save ratings to local storage", error);
    }
  }, [ratings, isLoading]);

  const addRating = useCallback((newRatingData: Omit<Rating, 'id' | 'timestamp'>) => {
    const newRating: Rating = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...newRatingData,
    };
    setRatings((prevRatings) => [newRating, ...prevRatings]);
    logActivity(`New ${newRating.rating}-star rating received.`, 'Customer', 'System');
  }, [logActivity]);

  const clearRatings = useCallback(() => {
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
