import { createContext, useContext, useReducer, useCallback, useRef } from 'react';

const NotificationContext = createContext(null);

const initialState = {
  notifications: [],
  unreadCount: 0,
};

function notificationReducer(state, action) {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    case 'MARK_ALL_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      };
    case 'MARK_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    default:
      return state;
  }
}

export function NotificationProvider({ children }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const audioRef = useRef(null);

  const playSound = useCallback(() => {
    try {
      // Create a simple notification beep using Web Audio API
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      // First beep
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.frequency.value = 830;
      osc1.type = 'sine';
      gain1.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc1.start(audioCtx.currentTime);
      osc1.stop(audioCtx.currentTime + 0.3);

      // Second beep
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.frequency.value = 1050;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.3, audioCtx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc2.start(audioCtx.currentTime + 0.15);
      osc2.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.log('Audio not available:', e);
    }
  }, []);

  const addNotification = useCallback(
    (message) => {
      const notification = {
        id: Date.now(),
        message,
        timestamp: new Date(),
        read: false,
      };
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
      playSound();
    },
    [playSound]
  );

  const markAllRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_READ' });
  }, []);

  const markRead = useCallback((id) => {
    dispatch({ type: 'MARK_READ', payload: id });
  }, []);

  return (
    <NotificationContext.Provider
      value={{ ...state, addNotification, markAllRead, markRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

export default NotificationContext;
