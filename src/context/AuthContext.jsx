import { createContext, useContext, useReducer, useCallback } from 'react';
import { supabase } from '../supabaseClient'; // PASTIKAN IMPORT INI ADA

const AuthContext = createContext(null);

const initialState = {
  user: null,
  isAuthenticated: false,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return { user: action.payload, isAuthenticated: true, error: null };
    case 'LOGIN_FAILURE':
      return { ...state, error: action.payload };
    case 'LOGOUT':
      return initialState;
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // UBAH JADI ASYNC SUPAYA BISA NGOMONG KE SUPABASE
  const login = useCallback(async (email, password) => {
    try {
      // 1. Login ke Supabase Auth (Cek Email & Password)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Ambil data Profile (Nama & Role) dari tabel yang kamu buat kemarin
      const { data: profileData, error: profileError } = await supabase
        .from('Profile') // Nama tabel di Supabase kamu
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      // 3. Masukkan data user ke dalam State Aplikasi
      const userPayload = {
        id: authData.user.id,
        email: authData.user.email,
        nama_lengkap: profileData.nama_lengkap,
        role: profileData.role, // Ini akan berisi: Direktur, Administrator, atau Teknisi
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

  return (
    <AuthContext.Provider value={{ ...state, login, logout, clearError }}>
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