
import { useState, useEffect } from 'react';
import { onAuthUserChanged } from '../services/firebase';
import { FirebaseUser } from '../types';

interface AuthState {
  user: FirebaseUser | null;
  isLoading: boolean;
  isAdmin: boolean; 
}

export const useAuth = (): AuthState => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthUserChanged((authUser) => {
      setUser(authUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // For this application, any logged-in user is considered an admin for task management.
  // In a more complex scenario, this would involve checking roles from Firestore.
  const isAdmin = !!user; 

  return { user, isLoading, isAdmin };
};
