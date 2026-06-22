import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store';

const SOCKET_URL = 'https://watchparty-vul6.onrender.com';

// Module-level singleton to prevent duplicate connections on re-renders
let socketSingleton = null;

export const useSocket = () => {
  const socketRef = useRef(null);
  const { token, user, logout } = useAuthStore();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      console.log('No user or token found, skipping socket connection.');
      // Clean up any existing socket if user logs out
      if (socketSingleton) {
        socketSingleton.disconnect();
        socketSingleton = null;
      }
      socketRef.current = null;
      setConnected(false);
      return;
    }

    // Reuse existing socket if already connected with same token
    if (socketSingleton && socketSingleton.connected) {
      socketRef.current = socketSingleton;
      setConnected(true);
      return;
    }

    // Disconnect stale socket before creating a new one
    if (socketSingleton) {
      socketSingleton.disconnect();
      socketSingleton = null;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      // Allow fallback to polling if websocket fails (fixes Reconnecting... loop)
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setConnected(false);
      // If server disconnected us, attempt reconnect automatically
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    socket.on('connect_error', (err) => {
      console.error('Socket Connection Error:', err.message);
      // Handle expired JWT — log out gracefully without crashing
      if (
        err.message === 'Invalid token' ||
        err.message === 'Authentication required' ||
        err.message?.toLowerCase().includes('expired')
      ) {
        console.warn('Token invalid/expired — logging out.');
        socket.disconnect();
        socketSingleton = null;
        logout();
      }
    });

    socketSingleton = socket;
    socketRef.current = socket;

    return () => {
      // Do NOT disconnect on unmount — keep singleton alive across page navigations
      // Only disconnect on logout (handled above via user/token becoming null)
    };
  }, [user, token, logout]);

  return { socket: socketRef.current, connected };
};