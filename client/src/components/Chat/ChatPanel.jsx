import React, { useState, useRef, useEffect } from 'react';

const QUICK_EMOJIS = ['😂', '😍', '🔥', '👏', '😭', '🎉', '💀', '🤯', '👀', '❤️'];

const s = {
  panel: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' },
  header: {
    padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)',
    fontSize: '11px', color: '#737373', fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: '1px', flexShrink: 0,
  },
  messages: { flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' },
  msg: (isSystem) => ({
    display: isSystem ? 'block' : 'flex',
    gap: '8px',
    textAlign: isSystem ? 'center' : 'left',
    animation: 'fadeIn 0.2s ease',
  }),
  avatar: (color) => ({
    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
    background: color || '#E50914', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '11px', fontWeight: '700', marginTop: '1px',
  }),
  msgBody: { flex: 1, minWidth: 0 },
  msgName: (color) => ({
    fontSize: '11px', fontWeight: '700', color: color || '#E50914', marginBottom: '3px',
  }),
  msgText: { fontSize: '13px', color: '#e0e0e0', lineHeight: '1.45', wordBreak: 'break-word' },
  systemText: { fontSize: '11px', color: '#555', padding: '2px 0' },
  emojiMsg: { fontSize: '28px', lineHeight: '1' },
  inputArea: {
    padding: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0,
  },
  emojiRow: { display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' },
  emojiBtn: {
    fontSize: '18px', background: 'none', border: 'none', cursor: 'pointer',
    padding: '3px 5px', borderRadius: '4px', transition: '0.15s ease',
    lineHeight: '1',
  },
  inputRow: { display: 'flex', gap: '8px' },
  input: {
    flex: 1, background: '#242424', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#fff',
    fontFamily: 'Inter, sans-serif', outline: 'none', margin: 0,
    resize: 'none',
  },
  sendBtn: {
    padding: '10px 16px', background: '#E50914', color: '#fff',
    border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
    cursor: 'pointer', fontFamily: 'Inter, sans-serif', flexShrink: 0,
    alignSelf: 'flex-end',
  },
  timestamp: { fontSize: '10px', color: '#555', marginTop: '2px' },
};

const formatTime = (date) => {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ChatPanel({ messages, currentUser, onSend, onReact }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim(), null);
    setText('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const sendEmoji = (emoji) => {
    onSend(null, emoji);
    onReact(emoji);
  };

  return (
    <div style={s.panel}>
      <div style={s.header}>💬 Chat</div>

      <div style={s.messages}>
        {messages.length === 0 && (
          <div style={{ color: '#444', fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>
            No messages yet. Say hi! 👋
          </div>
        )}
        {messages.map((msg, i) => {
          if (msg.type === 'system') {
            return (
              <div key={i} style={s.msg(true)}>
                <span style={s.systemText}>— {msg.text} —</span>
              </div>
            );
          }
          if (msg.type === 'emoji') {
            return (
              <div key={i} style={{ ...s.msg(false), alignItems: 'center' }}>
                <div style={s.avatar(msg.avatarColor)}>{msg.username?.[0]?.toUpperCase()}</div>
                <div style={s.msgBody}>
                  <div style={s.msgName(msg.avatarColor)}>{msg.username}</div>
                  <div style={s.emojiMsg}>{msg.emoji}</div>
                </div>
              </div>
            );
          }
          return (
            <div key={i} style={s.msg(false)}>
              <div style={s.avatar(msg.avatarColor)}>{msg.username?.[0]?.toUpperCase()}</div>
              <div style={s.msgBody}>
                <div style={s.msgName(msg.avatarColor)}>
                  {msg.username}
                  {msg.userId === currentUser?._id ? ' ✦' : ''}
                </div>
                <div style={s.msgText}>{msg.text}</div>
                <div style={s.timestamp}>{formatTime(msg.createdAt)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div style={s.inputArea}>
        <div style={s.emojiRow}>
          {QUICK_EMOJIS.map(emoji => (
            <button
              key={emoji}
              style={s.emojiBtn}
              onClick={() => sendEmoji(emoji)}
              title={`React with ${emoji}`}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              {emoji}
            </button>
          ))}
        </div>
        <div style={s.inputRow}>
          <textarea
            style={s.input}
            placeholder="Say something..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            rows={2}
            maxLength={500}
          />
          <button style={s.sendBtn} onClick={handleSend}>Send</button>
        </div>
      </div>
    </div>
  );
}
