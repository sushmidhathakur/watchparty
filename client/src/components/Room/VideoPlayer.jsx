import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactPlayer from 'react-player'; 

const YOUTUBE_API_SCRIPT_ID = 'youtube-iframe-api';

const extractYouTubeId = (url) => {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
  return match ? match[1] : null;
};

const s = {
  wrapper: {
    flex: 1, background: '#000', position: 'relative',
    display: 'flex', flexDirection: 'column', height: '100%', width: '100%',
  },
  playerContainer: {
    position: 'relative', width: '100%', height: '100%',
    flex: 1, background: '#000',
  },
  iframe: {
    position: 'absolute', top: 0, left: 0,
    width: '100%', height: '100%', border: 'none',
  },
  empty: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    color: '#444', textAlign: 'center', padding: '40px',
    background: '#0a0a0a', height: '100%',
  },
  toast: {
    position: 'absolute', bottom: '16px', left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '8px', padding: '10px 20px',
    fontSize: '13px', color: '#fff', whiteSpace: 'nowrap',
    zIndex: 10, animation: 'fadeIn 0.2s ease',
    pointerEvents: 'none',
  },
  hostBadge: {
    position: 'absolute', top: '12px', left: '12px',
    background: 'rgba(229,9,20,0.9)', borderRadius: '6px',
    padding: '4px 10px', fontSize: '11px', fontWeight: '700',
    letterSpacing: '1px', zIndex: 5, pointerEvents: 'none',
  },
};

export default function VideoPlayer({ roomState, isHost, playerRef, onPlay, onPause, onSeek }) {
  const containerRef = useRef(null);
  const fromSyncRef = useRef(false);    
  const [toast, setToast] = useState('');
  const [apiReady, setApiReady] = useState(false);
  const toastTimer = useRef(null);

  const currentUrl = roomState?.videoUrl || '';
  const videoId = extractYouTubeId(currentUrl);

  
  const isEmbedUrl = currentUrl.includes('vidoza') || 
                     currentUrl.includes('streamtape') || 
                     currentUrl.includes('dood') || 
                     currentUrl.includes('embed');

  
  const isDirectVideo = currentUrl.endsWith('.mp4') || currentUrl.startsWith('blob:');

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2500);
  }, []);

  // ── YouTube IFrame API Loading ─────────────────────────────────────────
  useEffect(() => {
    if (window.YT && window.YT.Player) { setApiReady(true); return; }

    if (!document.getElementById(YOUTUBE_API_SCRIPT_ID)) {
      const tag = document.createElement('script');
      tag.id = YOUTUBE_API_SCRIPT_ID;
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      setApiReady(true);
    };
  }, []);

  // ── YouTube Player Creation ───────────────────────────────────────────
  useEffect(() => {
    if (!apiReady || !videoId || isEmbedUrl || isDirectVideo || !containerRef.current) return;

    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch (_) {}
      playerRef.current = null;
    }

    const divId = 'yt-player-' + Date.now();
    const div = document.createElement('div');
    div.id = divId;
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(div);

    const player = new window.YT.Player(divId, {
      videoId,
      playerVars: {
        autoplay: 0,
        controls: isHost ? 1 : 0,   
        rel: 0, modestbranding: 1,
        iv_load_policy: 3,
        cc_load_policy: 0,
      },
      events: {
        onReady: (e) => {
          playerRef.current = e.target;
          const t = roomState?.playbackState?.currentTime || 0;
          if (t > 0) e.target.seekTo(t, true);
          if (roomState?.playbackState?.isPlaying) e.target.playVideo();
        },
        onStateChange: (e) => {
          if (fromSyncRef.current) return; 
          const YT = window.YT.PlayerState;
          const t = e.target.getCurrentTime();
          if (e.data === YT.PLAYING) onPlay(t);
          if (e.data === YT.PAUSED)  onPause(t);
          if (e.data === YT.BUFFERING && isHost) onSeek(t);
        },
      },
    });

    const origSeekTo = player.seekTo?.bind(player);
    if (origSeekTo) {
      player.seekTo = (t, allowSeekAhead) => {
        fromSyncRef.current = true;
        origSeekTo(t, allowSeekAhead);
        setTimeout(() => { fromSyncRef.current = false; }, 500);
      };
    }

    ['playVideo', 'pauseVideo'].forEach(method => {
      const orig = player[method]?.bind(player);
      if (orig) {
        player[method] = (...args) => {
          fromSyncRef.current = true;
          orig(...args);
          setTimeout(() => { fromSyncRef.current = false; }, 500);
        };
      }
    });

    playerRef.current = player;
  }, [apiReady, currentUrl, videoId]);


  if (!currentUrl) {
    return (
      <div style={s.empty}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎬</div>
        <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: '#666' }}>
          {isHost ? 'No video selected yet' : 'Waiting for host to pick a video'}
        </div>
        <div style={{ color: '#444', fontSize: '14px', maxWidth: '320px' }}>
          {isHost ? 'Paste a Movie URL or Upload a file below to start the party' : 'The host will start the video shortly'}
        </div>
      </div>
    );
  }

  return (
    <div style={s.wrapper}>
      {!isHost && <div style={s.hostBadge}>👑 GUEST VIEW</div>}
      
      <div style={s.playerContainer}>
        {/* */}
        {isEmbedUrl && (
          <iframe
            src={currentUrl}
            style={s.iframe}
            allowFullScreen
            scrolling="no"
            allow="autoplay; encrypted-media"
          />
        )}

        {/*  */}
        {isDirectVideo && !isEmbedUrl && !videoId && (
          <ReactPlayer
            ref={playerRef}
            url={currentUrl}
            controls={isHost}
            playing={roomState?.playbackState?.isPlaying}
            width="100%"
            height="100%"
            style={{ position: 'absolute', top: 0, left: 0 }}
            onPlay={() => !fromSyncRef.current && onPlay?.(playerRef.current?.getCurrentTime() || 0)}
            onPause={() => !fromSyncRef.current && onPause?.(playerRef.current?.getCurrentTime() || 0)}
          />
        )}

        {/*  */}
        {!isEmbedUrl && !isDirectVideo && videoId && (
          <div ref={containerRef} style={s.iframe} />
        )}
      </div>

      {toast && <div style={s.toast}>{toast}</div>}
    </div>
  );
}