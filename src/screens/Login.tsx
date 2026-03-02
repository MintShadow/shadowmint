import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      navigate('/wallet', { replace: true });
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #060810 0%, #071410 50%, #060810 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'DM Sans, system-ui, sans-serif',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg, #0d7a5f, #35f2a8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 0 30px rgba(53,242,168,0.35)',
          fontSize: 24,
        }}>✦</div>
        <h1 style={{ color: '#eef0f8', fontSize: 26, fontWeight: 700, margin: 0 }}>
          Shadow<span style={{ color: '#35f2a8' }}>Mint</span>
        </h1>
        <p style={{ color: 'rgba(238,240,248,0.45)', fontSize: 14, marginTop: 6 }}>Sign in to your wallet</p>
      </div>

      <div style={{
        width: '100%', maxWidth: 400,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20, padding: '32px 28px',
      }}>
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 10, padding: '12px 16px',
            color: '#f87171', fontSize: 14, marginBottom: 20,
          }}>{error}</div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ color: 'rgba(238,240,248,0.45)', fontSize: 13, display: 'block', marginBottom: 8 }}>Email</label>
          <input
            type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="you@example.com"
            style={{
              width: '100%', padding: '12px 16px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, color: '#eef0f8', fontSize: 15,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ color: 'rgba(238,240,248,0.45)', fontSize: 13, display: 'block', marginBottom: 8 }}>Password</label>
          <input
            type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="••••••••"
            style={{
              width: '100%', padding: '12px 16px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, color: '#eef0f8', fontSize: 15,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '14px',
            background: loading
              ? 'rgba(53,242,168,0.35)'
              : 'linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)',
            border: 'none', borderRadius: 12,
            color: '#050c18', fontSize: 16, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 0 20px rgba(53,242,168,0.28)',
          }}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>

        <p style={{ textAlign: 'center', color: 'rgba(238,240,248,0.45)', fontSize: 14, marginTop: 20 }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#35f2a8', textDecoration: 'none', fontWeight: 500 }}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}