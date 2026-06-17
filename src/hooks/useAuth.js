import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Custom hook for Supabase Authentication.
 * Manages auth state, login, logout, and user profile with role.
 */
export function useAuth() {
  const [authUser, setAuthUser] = useState(null); // Supabase auth.user object
  const [userProfile, setUserProfile] = useState(null); // Our users table row (has role)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user profile (role, displayName) from our users table
  const fetchUserProfile = useCallback(async (authId, email) => {
    const { data, error: fetchErr } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authId)
      .single();

    if (fetchErr || !data) {
      // User exists in Supabase Auth but not in our users table — deny access
      console.warn('No user profile found for auth_id:', authId);
      return null;
    }

    return {
      id: data.id,
      authId: data.auth_id,
      email: data.email,
      displayName: data.display_name,
      role: data.role,
      createdAt: data.created_at,
    };
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    // Check existing session on mount
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setAuthUser(session.user);
          const profile = await fetchUserProfile(session.user.id, session.user.email);
          setUserProfile(profile);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setAuthUser(session.user);
          const profile = await fetchUserProfile(session.user.id, session.user.email);
          setUserProfile(profile);
        } else if (event === 'SIGNED_OUT') {
          setAuthUser(null);
          setUserProfile(null);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, [fetchUserProfile]);

  // Login with email + password
  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const { data, error: loginErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (loginErr) throw loginErr;

      // Fetch profile to check role
      const profile = await fetchUserProfile(data.user.id, data.user.email);
      if (!profile) {
        // Auth succeeded but no profile → not an authorized user
        await supabase.auth.signOut();
        throw new Error('Your account is not authorized. Contact your administrator.');
      }

      setAuthUser(data.user);
      setUserProfile(profile);
      return { user: data.user, profile };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    setUserProfile(null);
  };

  return {
    authUser,
    userProfile,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!authUser && !!userProfile,
    isSuperAdmin: userProfile?.role === 'super_admin',
    isAdmin: userProfile?.role === 'admin' || userProfile?.role === 'super_admin',
    isUser: !!userProfile, // all authenticated users can view
  };
}
