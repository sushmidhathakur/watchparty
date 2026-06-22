import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useRoomStore } from '../store';

const s = {
  page: { minHeight: '100vh', background: '#141414' },
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 40px', position: 'sticky', top: 0, zIndex: 100,
    background: 'linear-gradient(180deg, rgba(20,20,20,0.98) 0%, transparent 100%)',
    backdropFilter: 'blur(8px)',
  },
  logo: {
    fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px',
    color: '#E50914', letterSpacing: '2px', cursor: 'pointer',
  },
  navRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  avatar: (color) => ({
    width: '36px', height: '36px', borderRadius: '50%',
    background: color || '#E50914', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
    border: '2px solid transparent', transition: '0.2s ease',
  }),
  hero: {
    padding: '80px 40px 60px',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 100%)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  heroTitle: {
    fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(48px, 8vw, 88px)',
    lineHeight: '1', marginBottom: '16px', letterSpacing: '2px',
  },
  redText: { color: '#E50914' },
  heroSub: { color: '#b3b3b3', fontSize: '18px', marginBottom: '40px', maxWidth: '540px' },
  heroBtns: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  btnPrimary: {
    padding: '14px 32px', background: '#E50914', color: '#fff',
    border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600',
    cursor: 'pointer', transition: '0.2s ease', fontFamily: 'Inter, sans-serif',
  },
  btnSecondary: {
    padding: '14px 32px', background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
    borderRadius: '8px', fontSize: '15px', fontWeight: '600',
    cursor: 'pointer', transition: '0.2s ease', fontFamily: 'Inter, sans-serif',
  },
  section: { padding: '48px 40px' },
  sectionHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '24px',
  },
  sectionTitle: { fontSize: '22px', fontWeight: '700' },
  grid: {
    display: 'grid', gap: '16px',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  },
  card: {
    background: '#181818', borderRadius: '12px', overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer',
    transition: 'transform 0.2s ease, border-color 0.2s ease',
  },
  cardBanner: (color) => ({
    height: '120px', background: `linear-gradient(135deg, ${color}22 0%, #111 100%)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '48px', position: 'relative',
  }),
  cardBody: { padding: '16px' },
  cardTitle: { fontSize: '15px', fontWeight: '600', marginBottom: '6px' },
  cardMeta: { color: '#737373', fontSize: '12px', display: 'flex', gap: '12px', marginBottom: '12px' },
  badge: (color = '#E50914') => ({
    padding: '3px 8px', borderRadius: '4px', fontSize: '11px',
    fontWeight: '600', background: `${color}22`, color: color,
    border: `1px solid ${color}44`,
  }),
  joinBtn: {
    width: '100%', padding: '10px', background: 'rgba(229,9,20,0.15)',
    border: '1px solid rgba(229,9,20,0.3)', color: '#E50914',
    borderRadius: '6px', fontSize: '13px', fontWeight: '600',
    cursor: 'pointer', transition: '0.2s ease', fontFamily: 'Inter, sans-serif',
  },
  emptyState: {
    textAlign: 'center', padding: '60px 20px', color: '#444',
    gridColumn: '1/-1',
  },
  inviteBar: {
    background: '#1f1f1f', borderRadius: '10px', padding: '20px 24px',
    border: '1px solid rgba(255,255,255,0.08)', display: 'flex',
    gap: '12px', alignItems: 'center', marginBottom: '48px',
    flexWrap: 'wrap',
  },
  inviteInput: { flex: 1, minWidth: '160px', margin: 0 },
  statsBar: {
    display: 'flex', gap: '32px', padding: '20px 40px',
    background: 'rgba(229,9,20,0.05)', borderTop: '1px solid rgba(229,9,20,0.1)',
    borderBottom: '1px solid rgba(229,9,20,0.1)',
  },
  stat: { textAlign: 'center' },
  statNum: { fontFamily: "'Bebas Neue', sans-serif", fontSize: '32px', color: '#E50914' },
  statLabel: { fontSize: '11px', color: '#737373', textTransform: 'uppercase', letterSpacing: '1px' },
};

const ROOM_EMOJIS = ['🎬', '🍿', '🎥', '📽️', '🎞️', '🎭'];
const ROOM_COLORS = ['#E50914', '#F5A623', '#7B68EE', '#00CED1', '#FF6B6B', '#4ECDC4'];

export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { rooms, fetchRooms, findByInviteCode } = useRoomStore();
  const [inviteCode, setInviteCode] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => { fetchRooms(); }, []);

  const joinByCode = async () => {
    if (!inviteCode.trim()) return;
    setJoining(true);
    setInviteError('');

    // Extract code/ID from pasted room URLs like "/room/abc123" or full URLs
    let cleanCode = inviteCode.trim();
    const roomUrlMatch = cleanCode.match(/\/room\/([a-zA-Z0-9]+)/);
    if (roomUrlMatch) cleanCode = roomUrlMatch[1];

    // Pass the code as-is (backend handles case-insensitive + ObjectId matching)
    const result = await findByInviteCode(cleanCode);
    setJoining(false);
    if (result.success) {
      navigate(`/room/${result.room._id}`);
    } else {
      setInviteError('Room not found. Check the code and try again.');
    }
  };

  const handleLogout = () => { logout(); navigate('/auth'); };

  return (
    <div style={s.page}>
      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.logo}>WATCHPARTY</div>
        <div style={s.navRight}>
          <button style={s.btnPrimary} onClick={() => navigate('/lobby')}>
            + Create Room
          </button>
          <div
            style={s.avatar(user?.avatarColor)}
            onClick={handleLogout}
            title="Click to sign out"
          >
            {user?.username?.[0]?.toUpperCase()}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={s.hero}>
        <h1 style={s.heroTitle}>
          WATCH<br /><span style={s.redText}>TOGETHER.</span>
        </h1>
        <p style={s.heroSub}>
          Create a room, paste any link, invite friends. Everyone stays in perfect sync.
        </p>
        <div style={s.heroBtns}>
          <button style={s.btnPrimary} onClick={() => navigate('/lobby')}>
            🎬 Start a Watch Party
          </button>
          <button style={s.btnSecondary} onClick={() => document.getElementById('rooms-section').scrollIntoView({ behavior: 'smooth' })}>
            Browse Public Rooms
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={s.statsBar}>
        {[
          { num: rooms.length || '—', label: 'Active Rooms' },
          { num: rooms.reduce((a, r) => a + (r.members?.length || 0), 0) || '—', label: 'Watching Now' },
          { num: '∞', label: 'Free Forever' },
        ].map(({ num, label }) => (
          <div key={label} style={s.stat}>
            <div style={s.statNum}>{num}</div>
            <div style={s.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      {/* Invite code */}
      <div style={{ ...s.section, paddingBottom: 0 }}>
        <div style={s.inviteBar}>
          <span style={{ fontSize: '14px', color: '#b3b3b3', whiteSpace: 'nowrap' }}>
            🔑 Have an invite code?
          </span>
          <input
            style={s.inviteInput}
            placeholder="Enter code or paste room link"
            value={inviteCode}
            onChange={e => { setInviteCode(e.target.value); setInviteError(''); }}
            onKeyDown={e => e.key === 'Enter' && joinByCode()}
          />
          <button style={{ ...s.btnPrimary, padding: '12px 24px' }} onClick={joinByCode} disabled={joining}>
            {joining ? '...' : 'Join'}
          </button>
          {inviteError && <span style={{ color: '#ff6b6b', fontSize: '13px', width: '100%' }}>{inviteError}</span>}
        </div>
      </div>

      {/* Public rooms */}
      <div style={s.section} id="rooms-section">
        <div style={s.sectionHeader}>
          <div style={s.sectionTitle}>🌐 Public Rooms</div>
          <button
            style={{ ...s.btnSecondary, padding: '8px 16px', fontSize: '13px' }}
            onClick={fetchRooms}
          >
            Refresh
          </button>
        </div>

        <div style={s.grid}>
          {rooms.length === 0 ? (
            <div style={s.emptyState}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎬</div>
              <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#555' }}>No public rooms yet</div>
              <div style={{ color: '#444', fontSize: '14px' }}>Be the first to start a watch party!</div>
            </div>
          ) : (
            rooms.map((room, i) => (
              <div
                key={room._id}
                style={s.card}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.borderColor = 'rgba(229,9,20,0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                }}
              >
                <div style={s.cardBanner(ROOM_COLORS[i % ROOM_COLORS.length])}>
                  <span style={{ fontSize: '52px' }}>{ROOM_EMOJIS[i % ROOM_EMOJIS.length]}</span>
                  <div style={{
                    position: 'absolute', top: '10px', right: '10px',
                    ...s.badge('#4ECDC4'),
                  }}>
                    LIVE
                  </div>
                </div>
                <div style={s.cardBody}>
                  <div style={s.cardTitle}>{room.title}</div>
                  <div style={s.cardMeta}>
                    <span>👤 {room.hostId?.username}</span>
                    <span>👥 {room.members?.length || 1} watching</span>
                  </div>
                  <button
                    style={s.joinBtn}
                    onClick={() => navigate(`/room/${room._id}`)}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(229,9,20,0.3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(229,9,20,0.15)'}
                  >
                    Join Room →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
