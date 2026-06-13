import React, { useState } from 'react';

const s = {
  bar: { display: 'flex', gap: '8px', padding: '12px 16px', background: '#1a1a1a', borderTop: '1px solid rgba(255,255,255,0.06)', alignItems: 'center', flexShrink: 0 },
  label: { fontSize: '12px', color: '#737373', whiteSpace: 'nowrap', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' },
  input: { flex: 1, background: '#242424', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '9px 14px', fontSize: '13px', color: '#fff', outline: 'none' },
  uploadBtn: { padding: '9px 14px', background: '#242424', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  btn: { padding: '9px 18px', background: '#E50914', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
};

export default function VideoUrlInput({ currentUrl, onChangeVideo }) {
  const [url, setUrl] = useState(currentUrl || '');
  const [error, setError] = useState('');

  // 1. PLAY FOR ALL: ఏ లింక్ ఇచ్చినా వెంటనే ప్లే అవ్వడానికి
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) { setError('Please enter a valid URL'); return; }

    // YouTube లేదా డైరెక్ట్ వీడియో లింక్ (.mp4) అయితే ఏ API కోసం వెయిట్ చేయకుండా వెంటనే ప్లే చేస్తుంది
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be') || trimmed.endsWith('.mp4') || trimmed.endsWith('.mkv')) {
      setError('');
      onChangeVideo(trimmed);
      return;
    }

    // వేరే వెబ్సైట్ లింక్స్ అయితేనే API కి వెళ్తుంది
    try {
      const response = await fetch('https://watchparty-vul6.onrender.com/api/extract-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl: trimmed })
      });
      const data = await response.json();
      if (data.success) { 
        setError('');
        onChangeVideo(data.videoUrl); 
      } else { 
        setError(data.message || 'Error extracting video'); 
      }
    } catch (err) { 
      setError('Failed to extract. Try a direct YouTube or MP4 link.'); 
    }
  };

  // 2. UPLOAD BUTTON: సిస్టమ్ లో ఉన్న ఫైల్ వెంటనే ప్లే అవ్వడానికి
  const handleLocalFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setError('');
      // URL.createObjectURL వాడటం వల్ల నీ సిస్టమ్ లోని ఫైల్ ని బ్రౌజర్ వెంటనే ప్లే చేస్తుంది
      const blobUrl = URL.createObjectURL(file);
      onChangeVideo(blobUrl); 
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <div style={s.bar}>
        <span style={s.label}>🎥 URL</span>
        <input 
          style={s.input} 
          placeholder="Paste YouTube or any Direct Link..." 
          value={url} 
          onChange={e => { setUrl(e.target.value); setError(''); }} 
        />
        
        <label style={s.uploadBtn}>
          📁 Upload
          <input 
            type="file" 
            accept="video/*" 
            onChange={handleLocalFileChange} 
            style={{ display: 'none' }} // ఇన్పుట్ ని దాచిపెట్టి బటన్ లాగా చూపిస్తున్నాం
          />
        </label>
        
        <button type="submit" style={s.btn}>Play for all</button>
      </div>
      
      {error && <div style={{ padding: '5px 16px', color: '#ff6b6b', fontSize: '12px', background: '#1a1a1a' }}>{error}</div>}
    </form>
  );
}