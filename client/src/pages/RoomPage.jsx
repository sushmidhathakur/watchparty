import React, { useState, useEffect } from 'react';
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

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { socket, connected } = useSocket();

  // 📱
  const [showChatMobile, setShowChatMobile] = useState(false);
  const [isCustomFullscreen, setIsCustomFullscreen] = useState(false);

  const {
    roomState, members, messages, reactions, isHost,
    playerRef, syncPlay, syncPause, syncSeek, changeVideo,
    sendMessage, sendReaction,
  } = useRoom(roomId, socket);


  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowChatMobile(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!roomState && !connected) {
    return (
      <div className="h-screen bg-neutral-950 flex items-center justify-center text-center text-neutral-500 font-sans">
        <div>
          <div className="text-5xl mb-4 animate-pulse">📡</div>
          <div className="text-lg font-bold mb-1 text-neutral-300">Connecting to room, Mawa...</div>
          <div className="text-xs text-neutral-500">This only takes a moment</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#141414] overflow-hidden font-sans relative">
      
      {/* 1.  */}
      <div className="relative z-20">
        <RoomHeader
          roomState={roomState}
          members={members}
          isHost={isHost}
          connected={connected}
          onLeave={() => navigate('/')}
        />
        
        {/* 📱 */}
        <button 
          onClick={() => setShowChatMobile(true)}
          className="md:hidden absolute right-16 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-700 active:scale-95 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-red-600/20"
        >
          💬 Chat
        </button>
      </div>

      {/* 2.  */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* 📺  */}
        <div className={`
          flex-1 flex flex-col overflow-hidden relative bg-black transition-all duration-300
          ${isCustomFullscreen ? 'fixed inset-0 z-50' : ''}
        `}>
          <div className="flex-1 flex items-center justify-center relative w-full h-full aspect-video md:aspect-auto">
            <VideoPlayer
              roomState={roomState}
              isHost={isHost}
              playerRef={playerRef}
              onPlay={syncPlay}
              onPause={syncPause}
              onSeek={syncSeek}
            />
          </div>

          {isHost && (
            <div className="p-2 bg-neutral-900/40 border-t border-neutral-800/30">
              <VideoUrlInput
                currentUrl={roomState?.videoUrl}
                onChangeVideo={changeVideo}
              />
            </div>
          )}

          {/* */}
          <EmojiReactions reactions={reactions} onReact={sendReaction} />

          {/* 🎬  */}
          <button
            onClick={() => setIsCustomFullscreen(!isCustomFullscreen)}
            className="absolute bottom-4 right-4 bg-black/80 hover:bg-black p-2 rounded-md border border-neutral-800 text-white z-10 text-xs uppercase font-bold tracking-wider transition-all"
          >
            {isCustomFullscreen ? 'Exit Fullscreen' : 'Cinema Fullscreen'}
          </button>
        </div>

        {/* 💬  */}
        <div className={`
          fixed inset-y-0 right-0 z-40 w-full md:w-[320px] lg:w-[360px] bg-[#181818] flex flex-col border-l border-white/[0.08]
          transition-transform duration-300 transform
          ${showChatMobile ? 'translate-x-0' : 'translate-x-full'}
          md:relative md:translate-x-0 md:flex
        `}>
          
          {/* 🎯  */}
          <div className="md:hidden flex items-center gap-2 p-3 bg-[#121212] border-b border-white/[0.05]">
            <button 
              type="button"
              onClick={() => setShowChatMobile(false)}
              className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-all text-lg font-bold"
            >
              ←
            </button>
            <span className="font-bold text-sm text-neutral-200">Back to Video</span>
          </div>

          {/*  */}
          <div className="flex-1 overflow-y-auto max-h-[30%] border-b border-white/[0.04]">
            <MemberList members={members} currentUserId={user?._id} />
          </div>

          {/* */}
          <div className="flex-[2] flex flex-col overflow-hidden bg-[#161616]">
            <ChatPanel
              messages={messages}
              currentUser={user}
              onSend={sendMessage}
              onReact={sendReaction}
            />
          </div>
        </div>

      </div>
    </div>
  );
}