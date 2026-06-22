import React, { useState, useEffect, useRef } from 'react';
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
  const { socket, connected } = useSocket();
  const [showChat, setShowChat] = useState(false);
  const [isFull, setIsFull] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevMessagesLen = useRef(0);

  const { roomState, members, messages, isHost, playerRef, syncPlay, syncPause, syncSeek, changeVideo, sendMessage } = useRoom(roomId, socket);

  // Track new incoming messages and increment unread badge when chat is hidden
  useEffect(() => {
    if (messages.length > prevMessagesLen.current) {
      // Only count as unread if chat panel is not visible
      if (!showChat || isFull) {
        const newMsgs = messages.length - prevMessagesLen.current;
        setUnreadCount(prev => prev + newMsgs);
      }
    }
    prevMessagesLen.current = messages.length;
  }, [messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-close chat when entering fullscreen
  const handleFullscreenToggle = () => {
    const entering = !isFull;
    setIsFull(entering);
    if (entering) {
      setShowChat(false);
    }
  };

  // Open chat and reset unread counter
  const openChat = () => {
    setShowChat(true);
    setUnreadCount(0);
  };

  // Hide chat (mobile back button)
  const closeChat = () => {
    setShowChat(false);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#000', color: '#fff', overflow: 'hidden' }}>
      <RoomHeader roomState={roomState} members={members} isHost={isHost} connected={connected} onLeave={() => navigate('/')} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <VideoPlayer playerRef={playerRef} roomState={roomState} isHost={isHost} onPlay={syncPlay} onPause={syncPause} onSeek={syncSeek} />
            <button onClick={handleFullscreenToggle} style={{ position: 'absolute', bottom: 20, right: 20, background: 'rgba(0,0,0,0.7)', padding: '8px 15px', zIndex: 10 }}>{isFull ? 'Exit Fullscreen' : 'Fullscreen'}</button>
          </div>
          {isHost && <VideoUrlInput currentUrl={roomState?.videoUrl} onChangeVideo={changeVideo} />}
        </div>
        {!isFull && (
          <div style={{ width: window.innerWidth < 768 ? '100%' : '350px', display: showChat || window.innerWidth >= 768 ? 'flex' : 'none', flexDirection: 'column', position: window.innerWidth < 768 ? 'fixed' : 'relative', zIndex: 1001, background: '#111' }}>
            <button onClick={closeChat} style={{ padding: '15px', background: 'none', border: 'none', color: '#fff' }}>← Back to Video</button>
            <div style={{ flex: 1, overflowY: 'auto' }}><MemberList members={members} /></div>
            <div style={{ flex: 2 }}><ChatPanel messages={messages} currentUser={user} onSend={sendMessage} /></div>
          </div>
        )}
      </div>
      {window.innerWidth < 768 && !showChat && !isFull && (
        <button
          onClick={openChat}
          style={{ position: 'absolute', bottom: 20, right: 20, padding: '15px', background: '#e50914', borderRadius: '50%' }}
        >
          Chat
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              background: '#fff',
              color: '#e50914',
              borderRadius: '50%',
              fontSize: '11px',
              fontWeight: '700',
              minWidth: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              lineHeight: '1',
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}