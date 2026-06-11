import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { useSocket } from '../hooks/useSocket';
import { useRoom } from '../hooks/useRoom';
import VideoPlayer from '../components/Room/VideoPlayer';
import ChatPanel from '../components/Chat/ChatPanel';
import MemberList from '../components/Room/MemberList';
import VideoUrlInput from '../components/Room/VideoUrlInput';
import EmojiReactions from '../components/Chat/EmojiReactions';
import RoomHeader from '../components/Room/RoomHeader';

const s = {
  page: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#141414', overflow: 'hidden' },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  left: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' },
  right: {
    width: '320px', flexShrink: 0,
    display: 'flex', flexDirection: 'column',
    background: '#181818', borderLeft: '1px solid rgba(255,255,255,0.08)',
  },
};

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { socket, connected } = useSocket();

  const {
    roomState, members, messages, reactions, isHost,
    playerRef, syncPlay, syncPause, syncSeek, changeVideo,
    sendMessage, sendReaction,
  } = useRoom(roomId, socket);

  if (!roomState && !connected) {
    return (
      <div style={{ ...s.page, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#737373' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📡</div>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>Connecting to room...</div>
          <div style={{ fontSize: '13px' }}>This only takes a moment</div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <RoomHeader
        roomState={roomState}
        members={members}
        isHost={isHost}
        connected={connected}
        onLeave={() => navigate('/')}
      />

      <div style={s.body}>
        {/* Left: Video + controls */}
        <div style={s.left}>
          <VideoPlayer
            roomState={roomState}
            isHost={isHost}
            playerRef={playerRef}
            onPlay={syncPlay}
            onPause={syncPause}
            onSeek={syncSeek}
          />

          {isHost && (
            <VideoUrlInput
              currentUrl={roomState?.videoUrl}
              onChangeVideo={changeVideo}
            />
          )}

          {/* Floating emoji reactions */}
          <EmojiReactions reactions={reactions} onReact={sendReaction} />
        </div>

        {/* Right: Members + Chat */}
        <div style={s.right}>
          <MemberList members={members} currentUserId={user?._id} />
          <ChatPanel
            messages={messages}
            currentUser={user}
            onSend={sendMessage}
            onReact={sendReaction}
          />
        </div>
      </div>
    </div>
  );
}