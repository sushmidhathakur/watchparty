import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore, api } from '../store';

export const useRoom = (roomId, socket) => {
  const { user } = useAuthStore();
  const [roomState, setRoomState] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const playerRef = useRef(null);   // YouTube player ref

  // Load chat history on join
  useEffect(() => {
    if (!roomId) return;
    api.get(`/messages/${roomId}`)
      .then(({ data }) => setMessages(data.messages))
      .catch(() => {});
  }, [roomId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !roomId) return;

    // Join the room
    socket.emit('room:join', {
      roomId,
      username: user?.username,
      avatarColor: user?.avatarColor,
    });

    const handlers = {
      'room:state': (state) => {
        setRoomState(state);
        setIsHost(state.isHost);
      },
      'room:users': ({ users }) => setMembers(users),

      // ── Video sync handlers ──────────────────────────────────────────────
      'video:play': ({ currentTime, clientTimestamp, serverTimestamp }) => {
        if (!playerRef.current) return;
        // Latency correction: add time elapsed since event was sent
        const latency = (Date.now() - serverTimestamp) / 1000;
        const correctedTime = currentTime + latency;
        playerRef.current.seekTo(correctedTime, true);
        playerRef.current.playVideo();
      },
      'video:pause': ({ currentTime }) => {
        if (!playerRef.current) return;
        playerRef.current.seekTo(currentTime, true);
        playerRef.current.pauseVideo();
      },
      'video:seek': ({ currentTime, serverTimestamp }) => {
        if (!playerRef.current) return;
        const latency = (Date.now() - serverTimestamp) / 1000;
        playerRef.current.seekTo(currentTime + latency, true);
      },
      'video:change': ({ videoUrl, videoType }) => {
        setRoomState(prev => prev ? { ...prev, videoUrl, videoType } : prev);
      },

      // ── Chat ─────────────────────────────────────────────────────────────
      'chat:message': (message) => {
        setMessages(prev => [...prev.slice(-199), message]);
      },

      // ── Reactions ────────────────────────────────────────────────────────
      'reaction:broadcast': (reaction) => {
        setReactions(prev => [...prev, reaction]);
        setTimeout(() => {
          setReactions(prev => prev.filter(r => r.id !== reaction.id));
        }, 3000);
      },
    };

    Object.entries(handlers).forEach(([event, fn]) => socket.on(event, fn));

    return () => {
      Object.entries(handlers).forEach(([event, fn]) => socket.off(event, fn));
      socket.emit('room:leave', { roomId });
    };
  }, [socket, roomId, user]);

  // ── Sync actions (called from VideoPlayer) ───────────────────────────────
  const syncPlay = useCallback((currentTime) => {
    socket?.emit('video:play', { roomId, currentTime, clientTimestamp: Date.now() });
  }, [socket, roomId]);

  const syncPause = useCallback((currentTime) => {
    socket?.emit('video:pause', { roomId, currentTime });
  }, [socket, roomId]);

  const syncSeek = useCallback((currentTime) => {
    socket?.emit('video:seek', { roomId, currentTime });
  }, [socket, roomId]);

  const changeVideo = useCallback((videoUrl) => {
    let videoType = 'none';
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) videoType = 'youtube';
    else if (videoUrl.startsWith('http')) videoType = 'direct';
    socket?.emit('video:change', { roomId, videoUrl, videoType });
  }, [socket, roomId]);

  const sendMessage = useCallback((text, emoji) => {
    socket?.emit('chat:send', { roomId, text, emoji });
  }, [socket, roomId]);

  const sendReaction = useCallback((emoji) => {
    socket?.emit('reaction:send', { roomId, emoji });
  }, [socket, roomId]);

  return {
    roomState, members, messages, reactions, isHost,
    playerRef, syncPlay, syncPause, syncSeek, changeVideo,
    sendMessage, sendReaction,
  };
};
