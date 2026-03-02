import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/wallet', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100vh',
      background: 'radial-gradient(circle at 40% 35%, rgba(53,242,168,0.08), transparent 55%), #060810',
      fontFamily: 'DM Sans, system-ui, sans-serif',
    }}>
      {/* Logo mark */}
      <div style={{
        width: 80, height: 80, borderRadius: 24,
        background: 'linear-gradient(135deg, #0d7a5f, #35f2a8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
        boxShadow: '0 0 40px rgba(53,242,168,0.4)',
        animation: 'mintPulse 2s ease-in-out infinite',
        fontSize: 36,
      }}>✦</div>

      <h1 style={{
        color: '#eef0f8', fontSize: 32, fontWeight: 700,
        letterSpacing: '-0.5px', margin: 0,
      }}>
        Shadow<span style={{ color: '#35f2a8' }}>Mint</span>
      </h1>
      <p style={{ color: 'rgba(238,240,248,0.45)', fontSize: 14, marginTop: 8 }}>
        Digital Wallet
      </p>

      {/* Loading dots */}
      <div style={{ display: 'flex', gap: 8, marginTop: 48 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#35f2a8', opacity: 0.3,
            animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes mintPulse {
          0%, 100% { box-shadow: 0 0 40px rgba(53,242,168,0.4); }
          50% { box-shadow: 0 0 60px rgba(53,242,168,0.75); }
        }
        @keyframes bounce {
          0%, 80%, 100% { opacity: 0.3; transform: scale(1); }
          40% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}