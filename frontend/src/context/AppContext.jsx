import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [systemStats, setSystemStats] = useState({
    uptime: '99.7%',
    activeScans: 0,
    threatsBlocked: 0,
    logsProcessed: 0,
  });
  const wsRef = useRef(null);
  const toastIdRef = useRef(0);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!isAuthenticated) return;

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
    const ws = new WebSocket(`${wsUrl}/ws`);
    wsRef.current = ws;

    ws.onopen = () => console.log('WS connected');
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleWsMessage(msg);
      } catch (_) {}
    };
    ws.onerror = (e) => console.warn('WS error', e);
    ws.onclose = () => console.log('WS closed');

    return () => {
      ws.close();
    };
  }, [isAuthenticated]);

  const handleWsMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'alert':
        setLiveAlerts(prev => [msg.data, ...prev].slice(0, 50));
        addToast(`New alert: ${msg.data.title}`, 'warning');
        break;
      case 'stats':
        setSystemStats(prev => ({ ...prev, ...msg.data }));
        break;
      case 'scan_complete':
        addToast(`Scan completed: ${msg.data.target}`, 'success');
        break;
      default:
        break;
    }
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = ++toastIdRef.current;
    setNotifications(prev => [...prev, { id, message, type, time: new Date() }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{
      sidebarOpen, setSidebarOpen,
      notifications, addToast, removeToast,
      liveAlerts,
      systemStats, setSystemStats,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
