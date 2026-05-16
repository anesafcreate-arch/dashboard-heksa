import { createContext, useContext, useReducer, useCallback } from 'react';

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

  const addNotification = useCallback(
    (message) => {
      const notification = {
        id: Date.now(),
        message,
        timestamp: new Date(),
        read: false,
      };
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    },
    []
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
