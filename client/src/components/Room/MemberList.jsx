import React from 'react';

const s = {
  panel: {
    padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
  },
  title: { fontSize: '11px', color: '#737373', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' },
  list: { display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '140px', overflowY: 'auto' },
  item: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: (color) => ({
    width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
    background: color || '#E50914', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '12px', fontWeight: '700',
  }),
  name: { fontSize: '13px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  badge: {
    fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
    background: 'rgba(229,9,20,0.2)', color: '#E50914',
    border: '1px solid rgba(229,9,20,0.3)', fontWeight: '700', flexShrink: 0,
  },
  liveDot: {
    width: '7px', height: '7px', borderRadius: '50%',
    background: '#00c864', flexShrink: 0,
  },
};

export default function MemberList({ members, currentUserId }) {
  return (
    <div style={s.panel}>
      <div style={s.title}>👥 In this room ({members.length})</div>
      <div style={s.list}>
        {members.length === 0 ? (
          <div style={{ color: '#444', fontSize: '12px' }}>No one here yet</div>
        ) : (
          members.map((m) => (
            <div key={m.socketId} style={s.item}>
              <div style={s.avatar(m.avatarColor)}>
                {m.username?.[0]?.toUpperCase() || '?'}
              </div>
              <span style={{ ...s.name, color: m.userId === currentUserId ? '#fff' : '#b3b3b3' }}>
                {m.username}
                {m.userId === currentUserId ? ' (you)' : ''}
              </span>
              <div style={s.liveDot} title="Online" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
