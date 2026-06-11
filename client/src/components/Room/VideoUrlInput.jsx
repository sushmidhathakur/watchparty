import React, { useState } from 'react';

const s = {
  bar: {
    display: 'flex', gap: '8px', padding: '12px 16px',
    background: '#1a1a1a', borderTop: '1px solid rgba(255,255,255,0.06)',
    alignItems: 'center', flexShrink: 0,
  },
  label: { fontSize: '12px', color: '#737373', whiteSpace: 'nowrap', fontWeight: '600' },
  input: {
    flex: 1, background: '#242424', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px', padding: '9px 14px', fontSize: '13px',
    color: '#fff', fontFamily: 'Inter, sans-serif', outline: 'none',
    margin: 0,
  },
  uploadBtn: {
    padding: '9px 14px', background: '#242424', color: '#fff',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '13px',
    fontWeight: '600', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
    whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px'
  },
  btn: {
    padding: '9px 18px', background: '#E50914', color: '#fff',
    border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600',
    cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
    flexShrink: 0,
  },
};

export default function VideoUrlInput({ currentUrl, onChangeVideo }) {
  const [url, setUrl] = useState(currentUrl || '');
  const [error, setError] = useState('');

  // 🔥 ఇక్కడే నీ పాత handleSubmit ప్లేస్ లో ఈ కొత్త API ఎక్స్‌ట్రాక్టర్ లాజిక్ సెట్ చేసాను మావా!
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) { 
      setError('Please enter a URL'); 
      return; 
    }

    // 1. ఒకవేళ అది డైరెక్ట్ యూట్యూబ్ లింక్ లేదా డైరెక్ట్ .mp4 లింక్ అయితే నార్మల్ గా పంపేయ్
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be') || trimmed.endsWith('.mp4')) {
      setError('');
      onChangeVideo(trimmed);
      return;
    }

    // 2. ఒకవేళ అది వేరే వెబ్‌సైట్ లింక్ అయితే (లైక్ JustWatch, MovieRules మొదలైనవి) బ్యాకెండ్ ఏపిఐ కి పంపుతాం
    try {
      setError('');
      const response = await fetch('http://localhost:5000/api/extract-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl: trimmed })
      });
      const data = await response.json();

      if (data.success) {
        onChangeVideo(data.videoUrl); // బ్యాకెండ్ వెతికి పట్టుకున్న అసలైన హిడెన్ వీడియో లింక్ ని ప్లేయర్ కి ఇస్తాం!
      } else {
        setError(data.message || 'No streamable video found on this page.');
      }
    } catch (err) {
      setError('Failed to extract video from this website.');
    }
  };

  const handleLocalFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setError('');
      const blobUrl = URL.createObjectURL(file); 
      onChangeVideo(blobUrl); 
    }
  };

  return (
    <form style={{ flexShrink: 0 }} onSubmit={handleSubmit}>
      <div style={s.bar}>
        <span style={s.label}>🎥 Video URL</span>
        
        <input
          style={s.input}
          placeholder="Paste YouTube or any Direct Movie (.mp4) Link..."
          value={url}
          onChange={e => { setUrl(e.target.value); setError(''); }}
        />

        <label style={s.uploadBtn}>
          📁 Upload Movie
          <input
            type="file"
            accept="video/*"
            onChange={handleLocalFileChange}
            style={{ display: 'none' }}
          />
        </label>

        <button type="submit" style={s.btn}>Play for all</button>
      </div>
      
      {error && (
        <div style={{ padding: '6px 16px', fontSize: '12px', color: '#ff6b6b', background: '#1a1a1a' }}>
          {error}
        </div>
      )}
    </form>
  );
}
