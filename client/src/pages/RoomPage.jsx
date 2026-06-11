import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { useSocket } from '../hooks/useSocket';
import { useRoom } from '../hooks/useRoom';
import VideoPlayer from '../components/Room/VideoPlayer';
import ChatPanel from '../components/Chat/ChatPanel';
import MemberList from '../components/Room/MemberList';
import RoomHeader from '../components/Room/RoomHeader';

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { socket, connected } = useSocket();
  const [showChat, setShowChat] = useState(false);
  const [isFull, setIsFull] = useState(false);

  const { roomState, members, messages, isHost, playerRef, syncPlay, syncPause, syncSeek, sendMessage } = useRoom(roomId, socket);

  const styles = {
    page: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#000', color: '#fff', overflow: 'hidden' },
    body: { flex: 1, display: 'flex', position: 'relative', overflow: 'hidden', minHeight: '0' },
    videoSection: { flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' },
    chatSection: { 
      width: '350px', background: '#111', borderLeft: '1px solid #333',
      display: showChat || window.innerWidth >= 768 ? 'flex' : 'none',
      flexDirection: 'column', position: window.innerWidth < 768 ? 'absolute' : 'relative',
      right: 0, top: 0, height: '100%', zIndex: 999
    }
  };

  return (
    <div style={styles.page}>
      <div style={{ padding: '10px', background: '#111', display: 'flex', justifyContent: 'space-between' }}>
        <RoomHeader roomState={roomState} members={members} onLeave={() => navigate('/')} />
        {window.innerWidth < 768 && <button onClick={() => setShowChat(true)} style={{ background: '#e50914', border: 'none', color: '#fff', padding: '5px 15px', borderRadius: '4px' }}>Chat</button>}
      </div>

      <div style={styles.body}>
        <div style={styles.videoSection}>
          <VideoPlayer playerRef={playerRef} roomState={roomState} isHost={isHost} onPlay={syncPlay} onPause={syncPause} onSeek={syncSeek} />
          <button onClick={() => setIsFull(!isFull)} style={{ position: 'absolute', bottom: 20, right: 20, background: 'rgba(0,0,0,0.7)', border: '1px solid #444', color: '#fff', padding: '8px' }}>
            {isFull ? 'Exit Cinema' : 'Cinema Fullscreen'}
          </button>
        </div>

        <div style={styles.chatSection}>
          <div style={{ padding: '10px', borderBottom: '1px solid #333' }}>
            <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', color: '#fff' }}>← Back to Video</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}><MemberList members={members} /></div>
          <div style={{ flex: 2 }}><ChatPanel messages={messages} currentUser={user} onSend={sendMessage} /></div>
        </div>
      </div>
    </div>
  );
}