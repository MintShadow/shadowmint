import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function KycPendingPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 40%, rgba(246,166,35,0.08), transparent 60%), #060810',
      fontFamily: 'DM Sans, system-ui, sans-serif', color: '#eef0f8',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', textAlign: 'center',
    }}>
      <div style={{
        width: 100, height: 100, borderRadius: '50%',
        background: 'linear-gradient(135deg, #78610d, #f6a623)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 44, marginBottom: 28,
        boxShadow: '0 0 50px rgba(246,166,35,0.3)',
        animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
      }}>⏳</div>

      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 12px',
        animation: 'fadeUp 0.4s 0.2s ease both' }}>
        Under Review
      </h1>
      <p style={{ color: 'rgba(238,240,248,0.55)', fontSize: 15, margin: '0 0 32px',
        maxWidth: 300, lineHeight: 1.6, animation: 'fadeUp 0.4s 0.3s ease both' }}>
        We're reviewing your documents. This usually takes <strong style={{ color: '#f6a623' }}>a few minutes</strong>, but can take up to 24 hours.
      </p>

      {/* Status card */}
      <div style={{
        background: 'rgba(246,166,35,0.08)', border: '1px solid rgba(246,166,35,0.2)',
        borderRadius: 20, padding: '20px 24px', width: '100%', maxWidth: 320,
        marginBottom: 32, animation: 'fadeUp 0.4s 0.4s ease both',
      }}>
        {[
          { icon: '☑', label: 'Documents submitted', done: true },
          { icon: '☑', label: 'Selfie submitted', done: true },
          { icon: '⏳', label: 'Identity review', done: false },
          { icon: '🔒', label: 'Account verification', done: false },
        ].map((step, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            paddingBottom: i < 3 ? 12 : 0, marginBottom: i < 3 ? 12 : 0,
            borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{step.icon}</span>
            <span style={{
              color: step.done ? '#eef0f8' : 'rgba(238,240,248,0.4)',
              fontSize: 14, fontWeight: step.done ? 600 : 400,
            }}>{step.label}</span>
          </div>
        ))}
      </div>

      <p style={{ color: 'rgba(238,240,248,0.35)', fontSize: 13, margin: '0 0 24px',
        animation: 'fadeUp 0.4s 0.5s ease both' }}>
        We'll notify you once your review is complete.
      </p>

      <button onClick={() => navigate('/profile')} style={{
        padding: '14px 36px', borderRadius: 14, border: 'none',
        background: 'linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)',
        color: '#050c18', fontSize: 16, fontWeight: 700, cursor: 'pointer',
        boxShadow: '0 0 24px rgba(53,242,168,0.3)',
        animation: 'fadeUp 0.4s 0.6s ease both',
      }}>Back to Profile</button>

      <style>{`
        @keyframes popIn{from{opacity:0;transform:scale(0.5)}to{opacity:1;transform:scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}