import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { supabase } from '../supabaseClient'; 

const AuthContext = createContext(null);

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true, // PENGAMAN 1: Tambahkan loading state
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

  // PENGAMAN 2: Cek sesi memori saat web pertama kali dibuka agar tidak logout otomatis
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profileData } = await supabase
            .from('Profile')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const userPayload = {
            id: session.user.id,
            email: session.user.email,
            nama_lengkap: profileData?.nama_lengkap,
            role: profileData?.role,
          };
          dispatch({ type: 'INITIALIZE', payload: { user: userPayload } });
        } else {
          dispatch({ type: 'INITIALIZE', payload: { user: null } });
        }
      } catch (error) {
        dispatch({ type: 'INITIALIZE', payload: { user: null } });
      }
    };

    initializeAuth();

    // Dengarkan perubahan jika user logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) dispatch({ type: 'LOGOUT' });
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;

      const { data: profileData, error: profileError } = await supabase
        .from('Profile')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      if (profileError) throw profileError;

      const userPayload = {
        id: authData.user.id,
        email: authData.user.email,
        nama_lengkap: profileData.nama_lengkap,
        role: profileData.role, 
      };

      dispatch({ type: 'LOGIN_SUCCESS', payload: userPayload });
      return true;
    } catch (err) {
      dispatch({ type: 'LOGIN_FAILURE', payload: err.message });
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // PENGAMAN 3: Tambahkan fungsi dummy agar Header.jsx tidak crash
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