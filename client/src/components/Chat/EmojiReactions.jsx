import React from 'react';

/* Emoji float up the left side of the screen when reactions are sent */

const FloatingEmoji = ({ reaction }) => {
  const left = 10 + Math.random() * 60;
  const style = {
    position: 'absolute',
    bottom: '80px',
    left: `${left}%`,
    fontSize: '36px',
    lineHeight: '1',
    animation: 'floatUp 3s ease-out forwards',
    pointerEvents: 'none',
    zIndex: 50,
    userSelect: 'none',
    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
  };
  return <div style={style}>{reaction.emoji}</div>;
};

const s = {
  container: {
    position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20,
    overflow: 'hidden',
  },
};

export default function EmojiReactions({ reactions, onReact }) {
  return (
    <div style={s.container}>
      {reactions.map(r => (
        <FloatingEmoji key={r.id} reaction={r} />
      ))}
    </div>
  );
}
