import React, { useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';

export default function VideoPlayer({ roomState, isHost, playerRef, onPlay, onPause, onSeek }) {
  const isSyncing = useRef(false);

  // When roomState.playbackState changes (driven by a remote sync event from useRoom),
  // perform an imperative seek if the gap is too large (handles seek-only events)
  useEffect(() => {
    if (!roomState?.playbackState || !playerRef.current) return;
    const { currentTime } = roomState.playbackState;

    const internalPlayer = playerRef.current.getInternalPlayer?.();
    if (!internalPlayer) return;

    // Only seek imperatively when there is a significant gap
    // (ReactPlayer handles play/pause via the `playing` prop automatically)
    const getCurrentTime = () => {
      if (typeof internalPlayer.getCurrentTime === 'function') return internalPlayer.getCurrentTime();
      if (typeof internalPlayer.currentTime === 'number') return internalPlayer.currentTime;
      return 0;
    };

    const current = getCurrentTime();
    if (Math.abs(current - currentTime) > 2) {
      isSyncing.current = true;
      if (typeof internalPlayer.seekTo === 'function') internalPlayer.seekTo(currentTime);
      else if (internalPlayer.currentTime !== undefined) internalPlayer.currentTime = currentTime;
      setTimeout(() => { isSyncing.current = false; }, 1000);
    }
  }, [roomState?.playbackState]);

  const handlePlay = () => {
    if (isSyncing.current) return;
    const internalPlayer = playerRef.current?.getInternalPlayer?.();
    const time = typeof internalPlayer?.getCurrentTime === 'function'
      ? internalPlayer.getCurrentTime()
      : (internalPlayer?.currentTime ?? 0);
    onPlay(time);
  };

  const handlePause = () => {
    if (isSyncing.current) return;
    const internalPlayer = playerRef.current?.getInternalPlayer?.();
    const time = typeof internalPlayer?.getCurrentTime === 'function'
      ? internalPlayer.getCurrentTime()
      : (internalPlayer?.currentTime ?? 0);
    onPause(time);
  };

  const handleSeek = (seconds) => {
    if (isSyncing.current) return;
    onSeek(seconds);
  };

  return (
    <ReactPlayer
      ref={playerRef}
      url={roomState?.videoUrl}
      width="100%"
      height="100%"
      controls={isHost}
      playing={roomState?.playbackState?.isPlaying ?? false}
      onPlay={handlePlay}
      onPause={handlePause}
      onSeek={handleSeek}
      config={{
        youtube: {
          playerVars: { controls: isHost ? 1 : 0, disablekb: isHost ? 0 : 1 },
        },
      }}
    />
  );
}