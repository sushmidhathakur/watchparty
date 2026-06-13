import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store';

const SOCKET_URL = 'https://watchparty-vul6.onrender.com';

export const useSocket = () => {
  const socketRef = useRef(null);
  const { token, user } = useAuthStore();
  const [connected, setConnected] = useState(false);
  // సాకెట్ ని రియాక్ట్ స్టేట్ లో పెడుతున్నాం, అప్పుడే RoomPage కి అప్డేట్ వెళ్తుంది
  const [socketInstance, setSocketInstance] = useState(null);

  useEffect(() => {
    if (!user) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setConnected(true);
      setSocketInstance(socket); // స్టేట్ అప్డేట్ చేసాం
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setConnected(false);
      setSocketInstance(null);
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
      setSocketInstance(null);
    };
  }, [user, token]);

  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event, handler) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  }, []);

  const off = useCallback((event, handler) => {
    socketRef.current?.off(event, handler);
  }, []);

  // ఇక్కడ socketRef.current బదులు socketInstance ని పంపుతున్నాం
  return { socket: socketInstance, connected, emit, on, off };
};