import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0505 50%, #0a0a0a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
  },
  bgGlow: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '600px',
    height: '600px',
    background: 'radial-gradient(circle, rgba(229,9,20,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    background: 'rgba(20,20,20,0.95)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '440px',
    backdropFilter: 'blur(20px)',
    position: 'relative',
    zIndex: 1,
    animation: 'fadeIn 0.4s ease',
  },
  logo: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '38px',
    letterSpacing: '2px',
    color: '#E50914',
    textAlign: 'center',
    marginBottom: '8px',
  },
  tagline: {
    textAlign: 'center',
    color: '#737373',
    fontSize: '13px',
    marginBottom: '36px',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '8px',
    padding: '4px',
    marginBottom: '28px',
  },
  tab: (active) => ({
    flex: 1,
    padding: '10px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: active ? '600' : '400',
    background: active ? '#E50914' : 'transparent',
    color: active ? '#fff' : '#737373',
    cursor: 'pointer',
    transition: '0.2s ease',
    border: 'none',
    fontFamily: 'Inter, sans-serif',
  }),
  field: { marginBottom: '16px' },
  label: {
    display: 'block',
    fontSize: '12px',
    color: '#737373',
    marginBottom: '6px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  btn: (variant = 'primary') => ({
    width: '100%',
    padding: '14px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    transition: '0.2s ease',
    fontFamily: 'Inter, sans-serif',
    background: variant === 'primary' ? '#E50914' : 'rgba(255,255,255,0.08)',
    color: '#fff',
    marginBottom: '12px',
  }),
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '20px 0',
    color: '#737373',
    fontSize: '12px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'rgba(255,255,255,0.1)',
  },
  error: {
    background: 'rgba(229,9,20,0.1)',
    border: '1px solid rgba(229,9,20,0.3)',
    borderRadius: '8px',
    padding: '12px',
    color: '#ff6b6b',
    fontSize: '13px',
    marginBottom: '16px',
  },
  guestInput: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
};

export default function AuthPage() {
  const navigate = useNavigate();
  const { register, login, loginAsGuest, loading, error, clearError } = useAuthStore();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [guestName, setGuestName] = useState('');

  const handleChange = (e) => {
    clearError();
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let result;
    if (tab === 'login') {
      result = await login(form.email, form.password);
    } else {
      result = await register(form.username, form.email, form.password);
    }
    if (result.success) navigate('/');
  };

  const handleGuest = async () => {
    const result = await loginAsGuest(guestName.trim() || undefined);
    if (result.success) navigate('/');
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow} />
      <div style={styles.card}>
        <div style={styles.logo}>WATCHPARTY</div>
        <div style={styles.tagline}>Watch movies together, anywhere</div>

        <div style={styles.tabs}>
          {['login', 'register'].map(t => (
            <button key={t} style={styles.tab(tab === t)} onClick={() => { setTab(t); clearError(); }}>
              {t === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {error && <div style={styles.error}>⚠ {error}</div>}

        <form onSubmit={handleSubmit}>
          {tab === 'register' && (
            <div style={styles.field}>
              <label style={styles.label}>Username</label>
              <input
                name="username"
                placeholder="your_username"
                value={form.username}
                onChange={handleChange}
                required
                autoComplete="username"
              />
            </div>
          )}
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            />
          </div>
          <button type="submit" style={styles.btn('primary')} disabled={loading}>
            {loading ? 'Loading...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span>or continue as guest</span>
          <div style={styles.dividerLine} />
        </div>

        <div style={styles.guestInput}>
          <input
            placeholder="Guest nickname (optional)"
            value={guestName}
            onChange={e => setGuestName(e.target.value)}
            style={{ margin: 0 }}
          />
          <button
            style={{ ...styles.btn('secondary'), width: 'auto', padding: '12px 20px', margin: 0 }}
            onClick={handleGuest}
            disabled={loading}
          >
            Go
          </button>
        </div>
        <div style={{ fontSize: '11px', color: '#444', textAlign: 'center' }}>
          Guest sessions don't save watch history
        </div>
      </div>
    </div>
  );
}
