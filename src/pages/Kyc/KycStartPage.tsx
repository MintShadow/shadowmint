import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

export default function KycStartPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('unverified');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login', { replace: true }); return; }
      const { data } = await supabase.from('kyc_status').select('status').eq('id', session.user.id).single();
      setStatus(data?.status ?? 'unverified');
      setLoading(false);
    };
    load();
  }, [navigate]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#060810', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#35f2a8', fontSize: 32, animation: 'pulse 1.5s infinite' }}>✦</div>
      <style>{`@keyframes pulse{0%,100%{opacity:0.4;transform:scale(0.9)}50%{opacity:1;transform:scale(1.1)}}`}</style>
    </div>
  );

  // Already verified
  if (status === 'verified') {
    return (
      <div style={{
        minHeight: '100vh', background: '#060810',
        fontFamily: 'DM Sans, system-ui, sans-serif', color: '#eef0f8',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px', textAlign: 'center',
      }}>
        <div style={{
          width: 90, height: 90, borderRadius: '50%',
          background: 'linear-gradient(135deg, #065f46, #35f2a8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40, marginBottom: 24,
          boxShadow: '0 0 50px rgba(53,242,168,0.35)',
        }}>✓</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>Identity Verified</h2>
        <p style={{ color: 'rgba(238,240,248,0.5)', fontSize: 15, marginBottom: 32 }}>
          Your identity has been successfully verified.
        </p>
        <button onClick={() => navigate('/profile')} style={{
          padding: '14px 36px', borderRadius: 14, border: 'none',
          background: 'linear-gradient(135deg, #35f2a8, #18c87a)',
          color: '#050c18', fontSize: 16, fontWeight: 700, cursor: 'pointer',
        }}>Back to Profile</button>
      </div>
    );
  }

  // Pending review
  if (status === 'pending') {
    navigate('/kyc/pending', { replace: true });
    return null;
  }

  const steps = [
    { icon: '🪪', title: 'Government ID', desc: 'Passport or driver\'s licence' },
    { icon: '🧑', title: 'Selfie', desc: 'A photo of your face' },
    { icon: '⏱️', title: 'Quick Review', desc: 'Usually approved within minutes' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 30% 20%, rgba(53,242,168,0.07), transparent 50%), #060810',
      fontFamily: 'DM Sans, system-ui, sans-serif', color: '#eef0f8',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px 16px' }}>
        <button onClick={() => navigate('/profile')} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, width: 40, height: 40, display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', color: '#eef0f8', fontSize: 18,
        }}>←</button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Verify Identity</h1>
      </div>

      <div style={{ padding: '8px 24px 32px' }}>
        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #065f46 0%, #0d7a5f 40%, #10b981 100%)',
          borderRadius: 24, padding: '32px 24px', textAlign: 'center',
          marginBottom: 32, position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(16,185,129,0.2)',
        }}>
          <div style={{
            position: 'absolute', top: -30, right: -30,
            width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.07)',
          }} />
          <div style={{ fontSize: 52, marginBottom: 16 }}>🪪</div>
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 10px' }}>
            Verify your identity
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            Required by Australian law to send and receive money. Takes less than 2 minutes.
          </p>
        </div>

        {/* Failed notice */}
        {status === 'failed' && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 14, padding: '14px 16px', marginBottom: 24,
            display: 'flex', gap: 12,
          }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <p style={{ margin: '0 0 4px', color: '#f87171', fontWeight: 700, fontSize: 14 }}>Previous attempt failed</p>
              <p style={{ margin: 0, color: 'rgba(238,240,248,0.5)', fontSize: 13 }}>Please try again with clear, well-lit photos.</p>
            </div>
          </div>
        )}

        {/* Steps */}
        <p style={{ color: 'rgba(238,240,248,0.35)', fontSize: 11, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px' }}>
          What you'll need
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          {steps.map((step, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: '14px 16px',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: 'rgba(53,242,168,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>{step.icon}</div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{step.title}</p>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(238,240,248,0.45)' }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => navigate('/kyc/document-type')} style={{
          width: '100%', padding: '16px', borderRadius: 14, border: 'none',
          background: 'linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)',
          color: '#050c18', fontSize: 16, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 0 24px rgba(53,242,168,0.3)',
        }}>Start Verification →</button>

        <p style={{ textAlign: 'center', color: 'rgba(238,240,248,0.3)', fontSize: 12, marginTop: 16 }}>
          Your data is encrypted and stored securely
        </p>
      </div>
    </div>
  );
}