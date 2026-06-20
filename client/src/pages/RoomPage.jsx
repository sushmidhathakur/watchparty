import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { useSocket } from '../hooks/useSocket';
import { useRoom } from '../hooks/useRoom';
import VideoPlayer from '../components/Room/VideoPlayer';
import ChatPanel from '../components/Room/ChatPanel';
import MemberList from '../components/Room/MemberList';
import VideoUrlInput from '../components/Room/VideoUrlInput';
import RoomHeader from '../components/Room/RoomHeader';

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { socket } = useSocket();
  const [showChat, setShowChat] = useState(false);
  const [isFull, setIsFull] = useState(false);
  const { roomState, members, messages, isHost, playerRef, syncPlay, syncPause, syncSeek, changeVideo, sendMessage } = useRoom(roomId, socket);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#000', color: '#fff', overflow: 'hidden' }}>
      <RoomHeader roomState={roomState} members={members} onLeave={() => navigate('/')} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <VideoPlayer playerRef={playerRef} roomState={roomState} isHost={isHost} onPlay={syncPlay} onPause={syncPause} onSeek={syncSeek} />
            <button onClick={() => setIsFull(!isFull)} style={{ position: 'absolute', bottom: 20, right: 20, background: 'rgba(0,0,0,0.7)', padding: '8px 15px', zIndex: 10 }}>{isFull ? 'Exit Fullscreen' : 'Fullscreen'}</button>
          </div>
          {isHost && <VideoUrlInput currentUrl={roomState?.videoUrl} onChangeVideo={changeVideo} />}
        </div>
        {!isFull && (
          <div style={{ width: window.innerWidth < 768 ? '100%' : '350px', display: showChat || window.innerWidth >= 768 ? 'flex' : 'none', flexDirection: 'column', position: window.innerWidth < 768 ? 'fixed' : 'relative', zIndex: 1001, background: '#111' }}>
            <button onClick={() => setShowChat(false)} style={{ padding: '15px', background: 'none', border: 'none', color: '#fff' }}>← Back to Video</button>
            <div style={{ flex: 1, overflowY: 'auto' }}><MemberList members={members} /></div>
            <div style={{ flex: 2 }}><ChatPanel messages={messages} currentUser={user} onSend={sendMessage} /></div>
          </div>
        )}
      </div>
      {window.innerWidth < 768 && !showChat && !isFull && <button onClick={() => setShowChat(true)} style={{ position: 'absolute', bottom: 20, right: 20, padding: '15px', background: '#e50914', borderRadius: '50%' }}>Chat</button>}
    </div>
  );
}