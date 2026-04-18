import { createContext, useContext, useReducer, useCallback } from 'react';
import { USERS } from '../data/mockData';

const AuthContext = createContext(null);

// Helper to get stored profile photo from localStorage
const getStoredProfilePhoto = (username) => {
  try {
    return localStorage.getItem(`profilePhoto_${username}`) || null;
  } catch {
    return null;
  }
};

// Helper to save profile photo to localStorage
const saveProfilePhoto = (username, photoUrl) => {
  try {
    if (photoUrl) {
      // If it's already a data URL, save directly
      if (photoUrl.startsWith('data:')) {
        localStorage.setItem(`profilePhoto_${username}`, photoUrl);
      } else if (photoUrl.startsWith('blob:')) {
        // Convert blob URL to base64 for persistence
        fetch(photoUrl)
          .then((res) => res.blob())
          .then((blob) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              localStorage.setItem(`profilePhoto_${username}`, reader.result);
            };
            reader.readAsDataURL(blob);
          })
          .catch(() => {});
      }
    } else {
      localStorage.removeItem(`profilePhoto_${username}`);
    }
  } catch {
    // localStorage unavailable
  }
};

// Get users from localStorage (supports Settings page additions)
const getUsers = () => {
  try {
    const stored = localStorage.getItem('app_users');
    if (stored) return JSON.parse(stored);
  } catch {}
  return USERS;
};

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
    case 'UPDATE_PROFILE_PHOTO':
      return { ...state, user: { ...state.user, profilePhoto: action.payload } };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = useCallback((username, password) => {
    // Check both default users and localStorage-stored users
    const allUsers = getUsers();
    const user = allUsers.find(
      (u) => u.username === username && u.password === password
    );
    if (user) {
      const storedPhoto = getStoredProfilePhoto(username);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { ...user, password: undefined, profilePhoto: storedPhoto },
      });
      return true;
    } else {
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Username atau password salah!' });
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const updateProfilePhoto = useCallback((photoUrl) => {
    dispatch({ type: 'UPDATE_PROFILE_PHOTO', payload: photoUrl });
    if (state.user?.username) {
      saveProfilePhoto(state.user.username, photoUrl);
    }
  }, [state.user?.username]);

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
