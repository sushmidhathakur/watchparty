import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store';

const SOCKET_URL = 'https://watchparty-vul6.onrender.com';

export const useSocket = () => {
  const socketRef = useRef(null);
  const { token, user } = useAuthStore();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
   
    if (!user || !token) {
      console.log("No user or token found, skipping socket connection.");
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'], 
      reconnection: true,       
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setConnected(false);
    });

   
    socket.on('connect_error', (err) => {
      console.error('Socket Connection Error:', err.message);
      
    });

    socketRef.current = socket;

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user, token]); 
  
  return { socket: socketRef.current, connected, emit, on, off };
};