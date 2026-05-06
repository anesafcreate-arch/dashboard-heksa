/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { resolveRole } from '../utils/roles';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'INITIALIZE':
      return { ...state, user: action.payload.user, isAuthenticated: !!action.payload.user, loading: false };
    case 'LOGIN_SUCCESS':
      return { ...state, user: action.payload, isAuthenticated: true, error: null };
    case 'LOGIN_FAILURE':
      return { ...state, error: action.payload, loading: false };
    case 'LOGOUT':
      return { ...initialState, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'UPDATE_PHOTO':
      return { ...state, user: { ...state.user, profilePhoto: action.payload } };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const getProfileByUser = useCallback(async (authUser) => {
    if (!authUser?.id) return null;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('id,email,role,created_at')
      .eq('id', authUser.id)
      .maybeSingle();

    const email = profileData?.email || authUser.email || '';
    const finalRole = resolveRole(profileData?.role, email);

    return {
      id: authUser.id,
      email,
      nama_lengkap: authUser.user_metadata?.nama_lengkap || email.split('@')[0],
      role: finalRole,
    };
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const userPayload = await getProfileByUser(session.user);
          dispatch({ type: 'INITIALIZE', payload: { user: userPayload } });
        } else {
          dispatch({ type: 'INITIALIZE', payload: { user: null } });
        }
      } catch {
        dispatch({ type: 'INITIALIZE', payload: { user: null } });
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const userPayload = await getProfileByUser(session.user);
        dispatch({ type: 'INITIALIZE', payload: { user: userPayload } });
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    });

    return () => subscription.unsubscribe();
  }, [getProfileByUser]);

  const login = useCallback(async (email, password) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;

      const userPayload = await getProfileByUser(authData.user);

      dispatch({ type: 'LOGIN_SUCCESS', payload: userPayload });
      return true;
    } catch (err) {
      dispatch({ type: 'LOGIN_FAILURE', payload: err.message });
      return false;
    }
  }, [getProfileByUser]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const updateProfilePhoto = useCallback((photoUrl) => {
    dispatch({ type: 'UPDATE_PHOTO', payload: photoUrl });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, clearError, updateProfilePhoto }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
