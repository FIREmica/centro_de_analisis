
"use client";

import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase as sbClient } from '@/lib/supabase/client'; 
import type { UserProfile } from '@/types/ai-schemas';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null;
  isPremium: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supabase = sbClient; 
  
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null); 

  const clearUserState = () => {
    setSession(null);
    setUser(null);
    setUserProfile(null);
    setIsPremium(false);
  };

  const clearUserState = () => {
    setSession(null);
    setUser(null);
    setUserProfile(null);
    setIsPremium(false);
  };

  const fetchUserProfile = useCallback(async (userIdToFetch: string | undefined) => {
<<<<<<< HEAD
    if (!userIdToFetch || !supabase) {
=======
    if (!userIdToFetch || !supabase) { 
>>>>>>> a70ea8f (a)
      setUserProfile(null);
      setIsPremium(false);
      if (!supabase) console.warn("AuthContext: Supabase client not available for fetchUserProfile.");
      return;
    }

    try {
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userIdToFetch)
        .maybeSingle(); 

      if (error) {
        console.error(`AuthContext: Error fetching user profile for ID ${userIdToFetch}:`, error.message);
        setUserProfile(null);
        setIsPremium(false);
      } else if (profileData) {
        const profile = profileData as UserProfile;
        setUserProfile(profile);
        const currentSubscriptionStatus = profile?.subscription_status?.toLowerCase() || 'free';
        const premiumStatuses = ['active_premium', 'premium_monthly', 'premium_yearly', 'active'];
        const newIsPremium = premiumStatuses.some(status => currentSubscriptionStatus.includes(status));
        setIsPremium(newIsPremium);
      } else {
        console.log(`AuthContext: No profile found for user ID ${userIdToFetch}. Setting profile to null and isPremium to false.`);
        setUserProfile(null);
        setIsPremium(false);
      }
    } catch (e: any) {
        console.error(`AuthContext: Critical error in fetchUserProfile for ID ${userIdToFetch}:`, e.message);
        setUserProfile(null);
        setIsPremium(false);
    }
  }, [supabase]);

  useEffect(() => {
    let authListenerSubscription: { unsubscribe: () => void } | null = null;

    if (!supabase) {
      setIsLoading(false);
      clearUserState();
<<<<<<< HEAD
      console.warn("AuthContext: Supabase client not initialized. Auth features disabled for this session.");
=======
      const supabaseInitErrorMsg = "Supabase client is not initialized. Authentication features are disabled. Please check environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.";
      setAuthError(supabaseInitErrorMsg);
      console.error("AuthContext: " + supabaseInitErrorMsg);
>>>>>>> a70ea8f (a)
      return () => {}; 
    }
    
    setAuthError(null); 

    const getInitialSessionAndProfile = async () => {
      setIsLoading(true);
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("AuthContext: Error getting initial session:", sessionError.message);
          clearUserState();
        } else if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          await fetchUserProfile(currentSession.user.id);
        } else {
          clearUserState();
        }
      } catch (e: any) {
        console.error("AuthContext: Exception during initial session/profile load:", e.message);
        clearUserState();
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSessionAndProfile();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setIsLoading(true);
        try {
          if (newSession) {
            setSession(newSession);
            setUser(newSession.user);
            await fetchUserProfile(newSession.user.id);
          } else {
            clearUserState();
          }
        } catch (e: any) {
          console.error("AuthContext: Exception during onAuthStateChange handling:", e.message);
          clearUserState();
        } finally {
          setIsLoading(false);
        }
      }
    );
    authListenerSubscription = listener?.subscription;

    return () => {
      authListenerSubscription?.unsubscribe();
    };
  }, [supabase, fetchUserProfile]);

  const signOutUser = async () => {
    if (!supabase) {
      console.warn("AuthContext: Supabase client not initialized. Cannot sign out.");
      setIsLoading(true);
      clearUserState();
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    await supabase.auth.signOut();
<<<<<<< HEAD
    // Auth listener should handle clearing user state.
    clearUserState(); // Explicitly clear state on sign out as well
=======
    clearUserState(); 
>>>>>>> a70ea8f (a)
    setIsLoading(false);
  };

  const refreshUserProfileData = useCallback(async () => {
<<<<<<< HEAD
    const currentAuthUser = user; // Use state variable for consistency
=======
    const currentAuthUser = user; 
>>>>>>> a70ea8f (a)
    if (currentAuthUser && supabase) { 
      await fetchUserProfile(currentAuthUser.id);
    } else if (!supabase) {
      console.warn("AuthContext: Supabase client not initialized. Cannot refresh profile.");
    } else {
      // console.log("AuthContext: No current user to refresh profile for.");
    }
  }, [user, supabase, fetchUserProfile]);

  const value = {
    session,
    user,
    userProfile,
    isPremium,
    isLoading,
    signOut: signOutUser,
    refreshUserProfile: refreshUserProfileData,
  };
  
  if (authError && isLoading) { 
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', padding: '20px', backgroundColor: '#f0f0f0', color: '#333', textAlign: 'center' }}>
            <h2 style={{ color: '#d9534f', marginBottom: '15px', fontSize: '1.5em' }}>Error de Configuración de Autenticación</h2>
            <p style={{ marginBottom: '10px', fontSize: '1.1em' }}>{authError}</p>
            <p style={{ fontSize: '0.9em' }}>Por favor, revise la consola para más detalles técnicos y asegúrese de que las variables de entorno de Supabase estén configuradas correctamente.</p>
        </div>
    );
  }


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
