import React, { useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';

export default function VideoPlayer({ roomState, isHost, playerRef, onPlay, onPause, onSeek }) {
  const isSyncing = useRef(false);

  useEffect(() => {
    if (!playerRef.current || !roomState?.playbackState) return;
    isSyncing.current = true;
    const { isPlaying, currentTime } = roomState.playbackState;
    if (Math.abs(playerRef.current.getCurrentTime() - currentTime) > 2) playerRef.current.seekTo(currentTime);
    isPlaying ? playerRef.current.getInternalPlayer()?.playVideo?.() : playerRef.current.getInternalPlayer()?.pauseVideo?.();
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
      onPlay={() => !isSyncing.current && onPlay(playerRef.current.getCurrentTime())}
      onPause={() => !isSyncing.current && onPause(playerRef.current.getCurrentTime())}
    />
  );
}