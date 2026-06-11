import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomStore } from '../store';

const s = {
  page: {
    minHeight: '100vh', background: '#141414',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px',
  },
  card: {
    background: '#181818', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px', padding: '48px 40px', width: '100%', maxWidth: '520px',
  },
  back: {
    display: 'flex', alignItems: 'center', gap: '8px',
    color: '#737373', fontSize: '13px', cursor: 'pointer',
    marginBottom: '32px', border: 'none', background: 'none', fontFamily: 'Inter, sans-serif',
  },
  title: {
    fontFamily: "'Bebas Neue', sans-serif", fontSize: '36px',
    letterSpacing: '2px', marginBottom: '8px',
  },
  subtitle: { color: '#737373', fontSize: '14px', marginBottom: '36px' },
  field: { marginBottom: '20px' },
  label: {
    display: 'block', fontSize: '12px', color: '#737373',
    marginBottom: '8px', fontWeight: '500',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  hint: { fontSize: '11px', color: '#555', marginTop: '6px' },
  toggleRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px', background: 'rgba(255,255,255,0.04)',
    borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)',
    marginBottom: '20px',
  },
  toggle: (active) => ({
    width: '44px', height: '24px', borderRadius: '12px',
    background: active ? '#E50914' : '#333', position: 'relative',
    cursor: 'pointer', transition: '0.25s ease', border: 'none',
  }),
  toggleDot: (active) => ({
    position: 'absolute', top: '3px',
    left: active ? '23px' : '3px',
    width: '18px', height: '18px',
    borderRadius: '50%', background: '#fff',
    transition: '0.25s ease',
  }),
  btn: {
    width: '100%', padding: '15px', background: '#E50914', color: '#fff',
    border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '700',
    cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: '0.2s ease',
    letterSpacing: '0.5px',
  },
  error: {
    background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.3)',
    borderRadius: '8px', padding: '12px', color: '#ff6b6b',
    fontSize: '13px', marginBottom: '16px',
  },
};

export default function LobbyPage() {
  const navigate = useNavigate();
  const { createRoom } = useRoomStore();
  const [form, setForm] = useState({ title: '', videoUrl: '', isPublic: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Room title is required'); return; }
    setLoading(true);
    setError('');
    const result = await createRoom(form.title.trim(), form.isPublic, form.videoUrl.trim());
    setLoading(false);
    if (result.success) {
      navigate(`/room/${result.room._id}`);
    } else {
      setError(result.error || 'Failed to create room');
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <button style={s.back} onClick={() => navigate('/')}>← Back to Home</button>

        <div style={s.title}>Create a Room</div>
        <div style={s.subtitle}>Set up your watch party in seconds</div>

        {error && <div style={s.error}>⚠ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={s.field}>
            <label style={s.label}>Room Name *</label>
            <input
              placeholder="Movie Night with Friends"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              maxLength={100}
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>YouTube URL (optional)</label>
            <input
              placeholder="https://youtube.com/watch?v=..."
              value={form.videoUrl}
              onChange={e => setForm(p => ({ ...p, videoUrl: e.target.value }))}
            />
            <div style={s.hint}>You can also add or change this inside the room</div>
          </div>

          <div style={s.toggleRow}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '3px' }}>
                {form.isPublic ? '🌐 Public Room' : '🔒 Private Room'}
              </div>
              <div style={{ fontSize: '12px', color: '#737373' }}>
                {form.isPublic ? 'Anyone can discover and join' : 'Invite-only via code'}
              </div>
            </div>
            <button
              type="button"
              style={s.toggle(form.isPublic)}
              onClick={() => setForm(p => ({ ...p, isPublic: !p.isPublic }))}
            >
              <div style={s.toggleDot(form.isPublic)} />
            </button>
          </div>

          <button type="submit" style={s.btn} disabled={loading}
            onMouseEnter={e => e.currentTarget.style.background = '#b20710'}
            onMouseLeave={e => e.currentTarget.style.background = '#E50914'}
          >
            {loading ? 'Creating...' : '🚀 Launch Room'}
          </button>
        </form>
      </div>
    </div>
  );
}
