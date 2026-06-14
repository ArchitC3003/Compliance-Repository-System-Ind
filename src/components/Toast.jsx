import { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';

function ToastItem({ notification, dispatch }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: notification.id });
    }, 3000);
    return () => clearTimeout(timer);
  }, [notification.id, dispatch]);

  const variants = {
    success: {
      bg: 'rgba(16, 185, 129, 0.15)',
      border: 'rgba(16, 185, 129, 0.3)',
      iconColor: '#10b981',
      icon: <CheckCircle size={16} />,
    },
    warning: {
      bg: 'rgba(245, 158, 11, 0.15)',
      border: 'rgba(245, 158, 11, 0.3)',
      iconColor: '#f59e0b',
      icon: <AlertTriangle size={16} />,
    },
    error: {
      bg: 'rgba(239, 68, 68, 0.15)',
      border: 'rgba(239, 68, 68, 0.3)',
      iconColor: '#ef4444',
      icon: <XCircle size={16} />,
    },
  };

  const v = variants[notification.variant] || variants.success;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        background: v.bg,
        border: `1px solid ${v.border}`,
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        minWidth: 300,
        maxWidth: 420,
        animation: 'fadeIn 200ms ease',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
      }}
    >
      <span style={{ color: v.iconColor, flexShrink: 0 }}>{v.icon}</span>
      <span style={{ flex: 1, color: '#f9fafb', lineHeight: 1.4 }}>{notification.message}</span>
      <button
        onClick={() => dispatch({ type: 'REMOVE_NOTIFICATION', payload: notification.id })}
        style={{
          background: 'none',
          border: 'none',
          color: '#6b7280',
          cursor: 'pointer',
          padding: 2,
          flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function Toast() {
  const { state, dispatch } = useAppContext();

  if (state.notifications.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: 8,
        zIndex: 200,
        pointerEvents: 'auto',
      }}
    >
      {state.notifications.slice(-3).map(n => (
        <ToastItem key={n.id} notification={n} dispatch={dispatch} />
      ))}
    </div>
  );
}
