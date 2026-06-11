import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactPlayer from 'react-player'; 

const YOUTUBE_API_SCRIPT_ID = 'youtube-iframe-api';

const extractYouTubeId = (url) => {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
  return match ? match[1] : null;
};


const s = {
  wrapper: { flex: 1, background: '#000', position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', width: '100%' },
  playerContainer: { position: 'relative', width: '100%', height: '100%', flex: 1, background: '#000' },
  iframe: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' },
  empty: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#444', textAlign: 'center', padding: '40px', background: '#0a0a0a', height: '100%' },
  toast: { position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', color: '#fff', zIndex: 10, pointerEvents: 'none' },
  hostBadge: { position: 'absolute', top: '12px', left: '12px', background: 'rgba(229,9,20,0.9)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '700', zIndex: 5 },
};

export default function VideoPlayer({ roomState, isHost, playerRef, onPlay, onPause, onSeek }) {
  const containerRef = useRef(null);
  const fromSyncRef = useRef(false);    
  const [apiReady, setApiReady] = useState(false);

  const currentUrl = roomState?.videoUrl || '';
  const videoId = extractYouTubeId(currentUrl);
  const isEmbedUrl = currentUrl.includes('vidoza') || currentUrl.includes('streamtape') || currentUrl.includes('dood') || currentUrl.includes('embed');
  const isDirectVideo = currentUrl.endsWith('.mp4') || currentUrl.startsWith('blob:');

  // Sync Logic 
  useEffect(() => {
    if (!playerRef.current || !roomState?.playbackState) return;

    fromSyncRef.current = true; // Lock
    const { isPlaying, currentTime } = roomState.playbackState;
    
    if (playerRef.current.seekTo) {
        const current = playerRef.current.getCurrentTime();
        if (Math.abs(current - currentTime) > 2) playerRef.current.seekTo(currentTime, true);
    }
    
    if (isPlaying) playerRef.current.playVideo?.();
    else playerRef.current.pauseVideo?.();
    
    setTimeout(() => { fromSyncRef.current = false; }, 800); // Unlock
  }, [roomState?.playbackState?.isPlaying, roomState?.playbackState?.currentTime]);

  useEffect(() => {
    if (window.YT && window.YT.Player) { setApiReady(true); return; }
    if (!document.getElementById(YOUTUBE_API_SCRIPT_ID)) {
      const tag = document.createElement('script');
      tag.id = YOUTUBE_API_SCRIPT_ID;
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }
    window.onYouTubeIframeAPIReady = () => setApiReady(true);
  }, []);

  useEffect(() => {
    if (!apiReady || !videoId || isEmbedUrl || isDirectVideo || !containerRef.current) return;
    
    const divId = 'yt-player-' + Date.now();
    const div = document.createElement('div');
    div.id = divId;
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(div);

    const player = new window.YT.Player(divId, {
      videoId,
      playerVars: { autoplay: 0, controls: isHost ? 1 : 0, rel: 0, modestbranding: 1 },
      events: {
        onReady: (e) => { playerRef.current = e.target; },
        onStateChange: (e) => {
          if (fromSyncRef.current) return;
          const YT = window.YT.PlayerState;
          if (e.data === YT.PLAYING) onPlay(e.target.getCurrentTime());
          if (e.data === YT.PAUSED) onPause(e.target.getCurrentTime());
        },
      },
    });
    playerRef.current = player;
  }, [apiReady, videoId]);

  return (
    <div style={s.wrapper}>
      {!isHost && <div style={s.hostBadge}>👑 GUEST VIEW</div>}
      <div style={s.playerContainer}>
        {isEmbedUrl && <iframe src={currentUrl} style={s.iframe} allowFullScreen allow="autoplay; encrypted-media" />}
        {isDirectVideo && !isEmbedUrl && (
          <ReactPlayer ref={playerRef} url={currentUrl} controls={isHost} playing={roomState?.playbackState?.isPlaying} width="100%" height="100%" />
        )}
        {!isEmbedUrl && !isDirectVideo && videoId && <div ref={containerRef} style={s.iframe} />}
      </div>
    </div>
  );
}