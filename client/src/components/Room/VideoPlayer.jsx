import React, { useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';

export default function VideoPlayer({ roomState, isHost, playerRef, onPlay, onPause, onSeek }) {
  const isSyncing = useRef(false);

  useEffect(() => {
    if (!roomState?.playbackState || !playerRef.current) return;
    
    isSyncing.current = true;
    const { isPlaying, currentTime } = roomState.playbackState;
    const player = playerRef.current.getInternalPlayer ? playerRef.current.getInternalPlayer() : playerRef.current;

    if (player && typeof player.seekTo === 'function') {
      const current = typeof player.getCurrentTime === 'function' ? player.getCurrentTime() : 0;
      // 2 seconds gap unte thappa seek cheyyadu (Glitch fix)
      if (Math.abs(current - currentTime) > 2) player.seekTo(currentTime);
    }

    if (player) {
      isPlaying ? player.playVideo?.() : player.pauseVideo?.();
    }
    
    setTimeout(() => { isSyncing.current = false; }, 1000);
  }, [roomState?.playbackState]);

  return (
    <ReactPlayer
      ref={playerRef}
      url={roomState?.videoUrl}
      width="100%"
      height="100%"
      controls={isHost}
      playing={roomState?.playbackState?.isPlaying}
      onPlay={() => {
        if (isSyncing.current) return;
        const player = playerRef.current?.getInternalPlayer?.();
        onPlay(player?.getCurrentTime ? player.getCurrentTime() : 0);
      }}
      onPause={() => {
        if (isSyncing.current) return;
        const player = playerRef.current?.getInternalPlayer?.();
        onPause(player?.getCurrentTime ? player.getCurrentTime() : 0);
      }}
      onSeek={(seconds) => {
        if (isSyncing.current) return;
        onSeek(seconds); // Seek event kuda sync ayyela add chesa mawa
      }}
    />
  );
}