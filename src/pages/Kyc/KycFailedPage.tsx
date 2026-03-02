import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';

export default function KycFailedPage() {
  const navigate = useNavigate();
  const [reason, setReason] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from('kyc_status').select('failure_reason').eq('id', session.user.id).single();
      setReason(data?.failure_reason ?? '');
    };
    load();
  }, []);

  const commonReasons = [
    { icon: '💡', title: 'Document photo unclear', desc: 'Retake with better lighting and ensure all 4 corners are visible.' },
    { icon: '📸', title: 'Text not readable', desc: 'Make sure your name, DOB and document number are clearly visible.' },
    { icon: '🧑', title: 'Selfie didn\'t match', desc: 'Ensure your face is clearly visible, well-lit, and matches your ID photo.' },
    { icon: '📋', title: 'Document expired', desc: 'Please use a current, valid government-issued ID.' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 35%, rgba(239,68,68,0.08), transparent 55%), #060810',
      fontFamily: 'DM Sans, system-ui, sans-serif', color: '#eef0f8',
      paddingBottom: 32,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px 16px' }}>
        <button onClick={() => navigate('/profile')} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, width: 40, height: 40, display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', color: '#eef0f8', fontSize: 18,
        }}>←</button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Verification Failed</h1>
      </div>

      <div style={{ padding: '8px 24px' }}>
        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #1c0808 0%, #3b1010 50%, #7f1d1d 100%)',
          borderRadius: 24, padding: '28px 24px', textAlign: 'center', marginBottom: 24,
          boxShadow: '0 8px 40px rgba(239,68,68,0.15)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -20, right: -20,
            width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
          }} />
          <div style={{ fontSize: 48, marginBottom: 14 }}>✗</div>
          <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>
            We couldn't verify your identity
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            {reason || 'Your documents could not be verified. Please try again with clearer photos.'}
          </p>
        </div>

        {/* Common reasons */}
        <p style={{ color: 'rgba(238,240,248,0.35)', fontSize: 11, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>
          Common reasons & fixes
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {commonReasons.map((item, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '14px 16px',
              display: 'flex', gap: 12,
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
              <div>
                <p style={{ margin: '0 0 3px', fontWeight: 600, fontSize: 14 }}>{item.title}</p>
                <p style={{ margin: 0, color: 'rgba(238,240,248,0.45)', fontSize: 13, lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => navigate('/kyc')} style={{
          width: '100%', padding: '16px', borderRadius: 14, border: 'none',
          background: 'linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)',
          color: '#050c18', fontSize: 16, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 0 24px rgba(53,242,168,0.3)', marginBottom: 12,
        }}>Try Again →</button>

        <button onClick={() => navigate('/profile')} style={{
          width: '100%', padding: '14px', borderRadius: 14,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(238,240,248,0.6)', fontSize: 15, fontWeight: 600, cursor: 'pointer',
        }}>Back to Profile</button>
      </div>
    </div>
  );
}