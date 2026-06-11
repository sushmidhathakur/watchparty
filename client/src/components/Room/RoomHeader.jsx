import React, { useState } from 'react';

const s = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    background: '#181818',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
    gap: '12px',
    flexWrap: 'wrap',
  },

  logo: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '22px',
    color: '#E50914',
    letterSpacing: '2px',
  },

  title: {
    fontSize: '15px',
    fontWeight: '600',
    flex: 1,
    minWidth: 0,
  },

  subtitle: {
    fontSize: '12px',
    color: '#737373',
    marginTop: '2px',
  },

  pill: (color = 'rgba(255,255,255,0.1)') => ({
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
    background: color,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  }),

  dot: (color) => ({
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: color,
  }),

  btn: {
    padding: '7px 14px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
    fontFamily: 'Inter, sans-serif',
    transition: '0.2s ease',
  },

  inviteBox: {
    background: '#1f1f1f',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '4px 4px 4px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
  },

  inviteCode: {
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#E50914',
    letterSpacing: '2px',
    fontSize: '14px',
  },

  copyBtn: {
    padding: '5px 10px',
    background: 'rgba(229,9,20,0.2)',
    border: '1px solid rgba(229,9,20,0.3)',
    color: '#E50914',
    borderRadius: '5px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  },
};

export default function RoomHeader({
  roomState,
  members,
  isHost,
  connected,
  onLeave,
}) {
  const [copied, setCopied] = useState(false);

  // 👑 అల్టిమేట్ ఫిక్స్ లాజిక్: 
  // 1. ఒకవేళ రూమ్‌కి ప్రత్యేకంగా inviteCode ఉంటే (పెద్ద అక్షరాల్లో) చూపిస్తుంది.
  // 2. ఒకవేళ అది లేకపోతే, ముక్కలు చేయకుండా పూర్తి MongoDB ఐడీని చిన్న అక్షరాల్లో (Lowercase) తీసుకుంటుంది.
  // దీనివల్ల కేస్-సెన్సిటివిటీ సమస్య 100% పోతుంది!
  const finalCode = roomState?.inviteCode 
    ? roomState.inviteCode.toUpperCase() 
    : (roomState?._id || roomState?.roomId || "").toLowerCase();

  const copyInvite = () => {
    if (!finalCode) return;
    
    // పక్కాగా కరెక్ట్ కోడ్ క్లిప్‌బోర్డ్‌కి కాపీ అవుతుంది
    navigator.clipboard.writeText(finalCode);

    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div style={s.header}>
      <div style={s.logo}>WP</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={s.title}>
          {roomState?.title || 'Watch Party'}
        </div>

        <div style={s.subtitle}>
          {isHost
            ? '👑 You are the host'
            : '👥 Watching together'}
        </div>
      </div>

      {/* Connection Status */}
      <div
        style={s.pill(
          connected
            ? 'rgba(0,200,100,0.2)'
            : 'rgba(255,60,60,0.2)'
        )}
      >
        <div
          style={s.dot(
            connected ? '#00c864' : '#ff3c3c'
          )}
        />
        {connected ? 'Connected' : 'Reconnecting...'}
      </div>

      {/* Member Count */}
      <div style={s.pill()}>
        👥 {members.length} watching
      </div>

      {/* Room Code + Copy Code */}
      <div style={s.inviteBox}>
        <span
          style={{
            color: '#737373',
            fontSize: '11px',
          }}
        >
          CODE
        </span>

        {/* ఇక్కడ ఒరిజినల్ కోడ్ లేదా కరెక్ట్ Lowercase ఐడీ పర్ఫెక్ట్‌గా కనిపిస్తుంది */}
        <span style={s.inviteCode}>
          {finalCode || '------'}
        </span>

        <button
          style={s.copyBtn}
          onClick={copyInvite}
        >
          {copied ? '✓ Copied' : 'Copy Code'}
        </button>
      </div>

      {/* Leave Button */}
      <button
        style={{
          ...s.btn,
          background: 'rgba(255,255,255,0.08)',
          color: '#b3b3b3',
        }}
        onClick={onLeave}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background =
            'rgba(229,9,20,0.2)')
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background =
            'rgba(255,255,255,0.08)')
        }
      >
        Leave
      </button>
    </div>
  );
}