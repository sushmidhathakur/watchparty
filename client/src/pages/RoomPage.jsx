import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { useSocket } from '../hooks/useSocket';
import { useRoom } from '../hooks/useRoom';
import VideoPlayer from '../components/Room/VideoPlayer';
import ChatPanel from '../components/Chat/ChatPanel';
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
      {/* Header */}
      <RoomHeader roomState={roomState} members={members} onLeave={() => navigate('/')} />
      
      {/* Main Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        
        {/* Left Side: Video */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <VideoPlayer playerRef={playerRef} roomState={roomState} isHost={isHost} onPlay={syncPlay} onPause={syncPause} onSeek={syncSeek} />
            
            {/* Fullscreen Button */}
            <button 
              onClick={() => setIsFull(!isFull)} 
              style={{ position: 'absolute', bottom: '20px', right: '20px', background: 'rgba(0,0,0,0.7)', border: '1px solid #444', color: '#fff', padding: '8px 15px', borderRadius: '5px', zIndex: 10 }}>
              {isFull ? 'Exit Fullscreen' : 'Cinema Fullscreen'}
            </button>
          </div>
          
          {/* URL Input */}
          {isHost && (
            <div style={{ padding: '15px', background: '#111', borderTop: '1px solid #333' }}>
              <VideoUrlInput currentUrl={roomState?.videoUrl} onChangeVideo={changeVideo} />
            </div>
          )}
        </div>

        {/* Right Side: Chat */}
        {!isFull && (
          <div style={{ 
            width: '350px', background: '#111', borderLeft: '1px solid #333',
            display: showChat || window.innerWidth >= 768 ? 'flex' : 'none',
            flexDirection: 'column', 
            position: window.innerWidth < 768 ? 'fixed' : 'relative',
            right: 0, top: 0, height: '100%', width: window.innerWidth < 768 ? '100%' : '350px',
            zIndex: 1001 
          }}>
            {/* Back Arrow */}
            <div style={{ padding: '15px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #333' }}>
              <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>← Back to Video</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}><MemberList members={members} /></div>
            <div style={{ flex: 2 }}><ChatPanel messages={messages} currentUser={user} onSend={sendMessage} /></div>
          </div>
        )}
      </div>

      {/* Mobile Chat Toggle Button */}
      {window.innerWidth < 768 && !showChat && !isFull && (
        <button onClick={() => setShowChat(true)} style={{ position: 'absolute', bottom: '20px', right: '20px', padding: '15px', background: '#e50914', borderRadius: '50%', border: 'none', color: '#fff', zIndex: 1000 }}>
          Chat
        </button>
      )}
    </div>
  );
}