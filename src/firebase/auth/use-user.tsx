"use client";
import { useEffect } from 'react';
import {
  useFirebase,
  useUser as useFirebaseUser, // aliased to avoid name collision
  UserHookResult,
} from '@/firebase/provider';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';

export const useUser = (): UserHookResult => {
  const { auth } = useFirebase();
  const userState = useFirebaseUser();

  useEffect(() => {
    // If there's no user, not loading, and no error, initiate anonymous sign-in
    if (!userState.user && !userState.isUserLoading && !userState.userError) {
      initiateAnonymousSignIn(auth);
    }
  }, [userState.user, userState.isUserLoading, userState.userError, auth]);

  // Return the original user state from the provider
  return userState;
};
