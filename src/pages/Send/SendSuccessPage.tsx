import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function SendSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { recipientEmail, amount, note } = location.state || {};
  const hasRedirected = useRef(false);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        navigate('/wallet', { replace: true });
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 40%, rgba(53,242,168,0.12), transparent 60%), #060810',
      fontFamily: 'DM Sans, system-ui, sans-serif',
      color: '#eef0f8',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', textAlign: 'center',
    }}>
      {/* Animated checkmark */}
      <div style={{
        width: 100, height: 100, borderRadius: '50%',
        background: 'linear-gradient(135deg, #065f46, #35f2a8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 32,
        boxShadow: '0 0 60px rgba(53,242,168,0.4)',
        animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
        fontSize: 44,
      }}>✓</div>

      <h1 style={{
        fontSize: 28, fontWeight: 800, margin: '0 0 12px',
        animation: 'fadeUp 0.4s 0.2s ease both',
      }}>
        Sent!
      </h1>

      <p style={{
        color: 'rgba(238,240,248,0.6)', fontSize: 15, margin: '0 0 32px',
        maxWidth: 280, lineHeight: 1.6,
        animation: 'fadeUp 0.4s 0.3s ease both',
      }}>
        {amount ? fmt(amount) : ''} was sent to <strong style={{ color: '#35f2a8' }}>{recipientEmail}</strong>
        {note ? ` · "${note}"` : ''}
      </p>

      {/* Details */}
      <div style={{
        background: 'rgba(53,242,168,0.06)',
        border: '1px solid rgba(53,242,168,0.15)',
        borderRadius: 20, padding: '20px 28px',
        width: '100%', maxWidth: 320,
        marginBottom: 32,
        animation: 'fadeUp 0.4s 0.4s ease both',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ color: 'rgba(238,240,248,0.5)', fontSize: 14 }}>Amount</span>
          <span style={{ color: '#35f2a8', fontWeight: 700, fontSize: 16 }}>{amount ? fmt(amount) : '‚Äî'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'rgba(238,240,248,0.5)', fontSize: 14 }}>To</span>
          <span style={{ color: '#eef0f8', fontWeight: 600, fontSize: 14 }}>{recipientEmail ?? '‚Äî'}</span>
        </div>
      </div>

      <button
        onClick={() => navigate('/wallet', { replace: true })}
        style={{
          padding: '14px 40px',
          background: 'linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)',
          border: 'none', borderRadius: 14,
          color: '#050c18', fontSize: 16, fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 0 24px rgba(53,242,168,0.3)',
          animation: 'fadeUp 0.4s 0.5s ease both',
        }}
      >
        Back to Wallet
      </button>

      <p style={{
        color: 'rgba(238,240,248,0.25)', fontSize: 12, marginTop: 20,
        animation: 'fadeUp 0.4s 0.6s ease both',
      }}>
        Redirecting in a few seconds…
      </p>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}