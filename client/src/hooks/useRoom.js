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

    // Guard to prevent local player events from echoing back to the server
    // when we are applying a remote sync command
    const isSyncing = { current: false };

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
      'video:play': ({ currentTime, serverTimestamp }) => {
        if (!playerRef.current) return;
        isSyncing.current = true;
        // Latency correction: add time elapsed since server sent the event
        const latency = serverTimestamp ? (Date.now() - serverTimestamp) / 1000 : 0;
        const correctedTime = currentTime + latency;
        try {
          const player = playerRef.current.getInternalPlayer?.() || playerRef.current;
          if (player?.seekTo) player.seekTo(correctedTime, true);
          else if (player?.currentTime !== undefined) player.currentTime = correctedTime;
          player?.playVideo?.();
        } catch (e) { /* ignore player errors during sync */ }
        // Update local roomState so ReactPlayer's `playing` prop becomes true
        setRoomState(prev => prev
          ? { ...prev, playbackState: { ...prev.playbackState, isPlaying: true, currentTime: correctedTime } }
          : prev
        );
        setTimeout(() => { isSyncing.current = false; }, 1000);
      },

      'video:pause': ({ currentTime, serverTimestamp }) => {
        if (!playerRef.current) return;
        isSyncing.current = true;
        try {
          const player = playerRef.current.getInternalPlayer?.() || playerRef.current;
          if (player?.seekTo) player.seekTo(currentTime, true);
          else if (player?.currentTime !== undefined) player.currentTime = currentTime;
          player?.pauseVideo?.();
        } catch (e) { /* ignore */ }
        setRoomState(prev => prev
          ? { ...prev, playbackState: { ...prev.playbackState, isPlaying: false, currentTime } }
          : prev
        );
        setTimeout(() => { isSyncing.current = false; }, 1000);
      },

      'video:seek': ({ currentTime, serverTimestamp }) => {
        if (!playerRef.current) return;
        isSyncing.current = true;
        const latency = serverTimestamp ? (Date.now() - serverTimestamp) / 1000 : 0;
        const correctedTime = currentTime + latency;
        try {
          const player = playerRef.current.getInternalPlayer?.() || playerRef.current;
          if (player?.seekTo) player.seekTo(correctedTime, true);
          else if (player?.currentTime !== undefined) player.currentTime = correctedTime;
        } catch (e) { /* ignore */ }
        setRoomState(prev => prev
          ? { ...prev, playbackState: { ...prev.playbackState, currentTime: correctedTime } }
          : prev
        );
        setTimeout(() => { isSyncing.current = false; }, 500);
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
