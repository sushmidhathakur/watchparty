import React, { useState } from 'react';

const s = {
  bar: { display: 'flex', gap: '8px', padding: '12px 16px', background: '#1a1a1a', borderTop: '1px solid rgba(255,255,255,0.06)', alignItems: 'center', flexShrink: 0 },
  label: { fontSize: '12px', color: '#737373', whiteSpace: 'nowrap', fontWeight: '600' },
  input: { flex: 1, background: '#242424', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '9px 14px', fontSize: '13px', color: '#fff', outline: 'none' },
  uploadBtn: { padding: '9px 14px', background: '#242424', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  btn: { padding: '9px 18px', background: '#E50914', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
};

export default function VideoUrlInput({ currentUrl, onChangeVideo }) {
  const [url, setUrl] = useState(currentUrl || '');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) { setError('Please enter a URL'); return; }
    
    // Youtube or .mp4 check
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be') || trimmed.endsWith('.mp4')) {
      onChangeVideo(trimmed);
      return;
    }
    
    // API Call for other sites
    try {
      const response = await fetch('https://watchparty-vul6.onrender.com/api/extract-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl: trimmed })
      });
      const data = await response.json();
      if (data.success) { onChangeVideo(data.videoUrl); } else { setError(data.message || 'Error'); }
    } catch (err) { setError('Failed to extract.'); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={s.bar}>
        <span style={s.label}>🎥 URL</span>
        <input 
          style={s.input} 
          placeholder="Paste link..." 
          value={url} 
          onChange={e => { setUrl(e.target.value); setError(''); }} 
        />
        
        <label style={s.uploadBtn}>
          📁 Upload 
          <input 
            type="file" 
            accept="video/*" 
            onChange={e => e.target.files[0] && onChangeVideo(URL.createObjectURL(e.target.files[0]))} 
            style={{ display: 'none' }} 
          />
        </label>
        
        {/* Play for all button - Form submit avutundi, so functionality work avtundi */}
        <button type="submit" style={s.btn}>Play for all</button>
      </div>
      
      {error && <div style={{ padding: '5px 15px', color: '#ff6b6b', fontSize: '12px' }}>{error}</div>}
    </form>
  );
}