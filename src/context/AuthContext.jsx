/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { getProfileById, upsertProfileRecord } from '../utils/profileStore';
import { getDefaultAuthedPath, resolveRole } from '../utils/roles';

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
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: !!action.payload.user,
        error: null,
        loading: false,
      };
    case 'LOGIN_SUCCESS':
      return { ...state, user: action.payload, isAuthenticated: true, error: null, loading: false };
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

  const buildUserPayload = useCallback(async (authUser) => {
    if (!authUser?.id) return null;

    const { profile, table } = await getProfileById(authUser.id);
    const email = profile?.email || authUser.email || '';
    const finalRole = resolveRole(profile?.role || authUser.user_metadata?.role, email);

    if (!profile && authUser.id && email) {
      try {
        await upsertProfileRecord({
          id: authUser.id,
          email,
          role: finalRole,
        }, table);
      } catch {
        // Biarkan login tetap jalan walau sinkronisasi profil gagal.
      }
    }

    return {
      id: authUser.id,
      email,
      username: profile?.username || email.split('@')[0],
      nama_lengkap:
        authUser.user_metadata?.nama_lengkap
        || authUser.user_metadata?.full_name
        || profile?.username
        || email.split('@')[0],
      role: finalRole,
      defaultPath: getDefaultAuthedPath(finalRole),
      isActive: profile?.isActive ?? true,
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const syncSessionUser = async (sessionUser) => {
      try {
        const userPayload = await buildUserPayload(sessionUser);

        if (!isMounted) return;

        if (userPayload && userPayload.isActive === false) {
          await supabase.auth.signOut();
          dispatch({ type: 'LOGIN_FAILURE', payload: 'Akun ini dinonaktifkan. Hubungi AdminUtama.' });
          dispatch({ type: 'LOGOUT' });
          return;
        }

        dispatch({ type: 'INITIALIZE', payload: { user: userPayload } });
      } catch {
        if (isMounted) {
          dispatch({ type: 'INITIALIZE', payload: { user: null } });
        }
      }
    };

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          await syncSessionUser(session.user);
        } else {
          dispatch({ type: 'INITIALIZE', payload: { user: null } });
        }
      } catch {
        dispatch({ type: 'INITIALIZE', payload: { user: null } });
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        window.setTimeout(() => {
          void syncSessionUser(session.user);
        }, 0);
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [buildUserPayload]);

  const login = useCallback(async (email, password) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;

      const userPayload = await buildUserPayload(authData.user);

      if (!userPayload) {
        throw new Error('Data user tidak ditemukan setelah login.');
      }

      if (userPayload.isActive === false) {
        await supabase.auth.signOut();
        throw new Error('Akun ini dinonaktifkan. Hubungi AdminUtama.');
      }

      dispatch({ type: 'LOGIN_SUCCESS', payload: userPayload });
      return userPayload;
    } catch (err) {
      dispatch({ type: 'LOGIN_FAILURE', payload: err.message });
      return null;
    }
  }, [buildUserPayload]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
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
