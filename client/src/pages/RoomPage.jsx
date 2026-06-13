import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import VideoPlayer from '../components/Room/VideoPlayer';
import ChatPanel from '../components/Room/ChatPanel';
import VideoUrlInput from '../components/Room/VideoUrlInput';

const s = {
  container: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', background: '#141414', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  logo: { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#E50914', fontSize: '20px' },
  badge: { fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px' },
  main: { display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' },
  playerSection: { flex: 1, display: 'flex', flexDirection: 'column', background: '#000', position: 'relative' },
  controls: { display: 'flex', alignItems: 'center', gap: '12px' },
  codeBox: { display: 'flex', alignItems: 'center', background: '#242424', borderRadius: '6px', padding: '2px 2px 2px 10px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px' },
  codeText: { fontFamily: 'monospace', color: '#ff4a4a', fontWeight: 'bold', marginRight: '10px' },
  copyBtn: { background: '#E50914', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  leaveBtn: { background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }
};

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const [videoUrl, setVideoUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleVideoChange = (newUrl) => {
    setVideoUrl(newUrl);
    if (socket && connected) {
      socket.emit('video-update', { roomId, videoUrl: newUrl });
    }
  };

  useEffect(() => {
    if (socket && connected) {
      socket.emit('join-room', { roomId });

      socket.on('video-sync', (data) => {
        if (data?.videoUrl) setVideoUrl(data.videoUrl);
      });
    }
    return () => {
      if (socket) socket.off('video-sync');
    };
  }, [socket, connected, roomId]);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={s.container}>
      {/* 1 */}
      <header style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={s.logo}>
            <span>WP</span>
            <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>Watch Party</span>
          </div>
          
          <div style={{
            ...s.badge, 
            background: connected ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
            color: connected ? '#2ecc71' : '#e74c3c'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: connected ? '#2ecc71' : '#e74c3c' }}></span>
            {connected ? 'Connected' : 'Reconnecting...'}
          </div>
        </div>

        <div style={s.controls}>
          <div style={s.codeBox}>
            <span style={{ color: '#888', marginRight: '6px' }}>CODE</span>
            <span style={s.codeText}>{roomId}</span>
            <button onClick={copyRoomCode} style={s.copyBtn}>
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <button onClick={() => navigate('/')} style={s.leaveBtn}>Leave</button>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA (Player Panel + Chat Panel) */}
      <div style={s.main}>
        {/* */}
        <div style={s.playerSection}>
          <VideoPlayer videoUrl={videoUrl} roomId={roomId} socket={socket} />
          {/*  */}
          <VideoUrlInput currentUrl={videoUrl} onChangeVideo={handleVideoChange} />
        </div>

        {/*  */}
        <ChatPanel roomId={roomId} socket={socket} />
      </div>
    </div>
  );
}