import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function WithdrawSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { amount, account } = location.state || {};
  const hasRedirected = useRef(false);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        navigate('/wallet', { replace: true });
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 40%, rgba(246,166,35,0.1), transparent 60%), #060810',
      fontFamily: 'DM Sans, system-ui, sans-serif', color: '#eef0f8',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', textAlign: 'center',
    }}>
      {/* Icon */}
      <div style={{
        width: 100, height: 100, borderRadius: '50%',
        background: 'linear-gradient(135deg, #78610d, #f6a623)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 32, fontSize: 44,
        boxShadow: '0 0 60px rgba(246,166,35,0.35)',
        animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
      }}>🏧</div>

      <h1 style={{
        fontSize: 28, fontWeight: 800, margin: '0 0 12px',
        animation: 'fadeUp 0.4s 0.2s ease both',
      }}>
        Withdrawal Submitted!
      </h1>

      <p style={{
        color: 'rgba(238,240,248,0.55)', fontSize: 15, margin: '0 0 32px',
        maxWidth: 300, lineHeight: 1.6,
        animation: 'fadeUp 0.4s 0.3s ease both',
      }}>
        {amount ? fmt(amount) : ''} will be deposited to{' '}
        <strong style={{ color: '#f6a623' }}>{account?.account_name ?? 'your account'}</strong> within 1–2 business days.
      </p>

      {/* Details */}
      <div style={{
        background: 'rgba(246,166,35,0.08)', border: '1px solid rgba(246,166,35,0.2)',
        borderRadius: 20, padding: '20px 28px',
        width: '100%', maxWidth: 320, marginBottom: 32,
        animation: 'fadeUp 0.4s 0.4s ease both',
      }}>
        {[
          { label: 'Amount',     value: amount ? fmt(amount) : '—', color: '#f6a623' },
          { label: 'To',         value: account?.account_name ?? '—' },
          { label: 'BSB',        value: account?.bsb ?? '—', mono: true },
          { label: 'Account',    value: account?.account_number ?? '—', mono: true },
          { label: 'Status',     value: 'Processing', color: '#60a5fa' },
          { label: 'Arrives',    value: '1–2 business days' },
        ].map((row, i, arr) => (
          <div key={row.label} style={{
            display: 'flex', justifyContent: 'space-between',
            paddingBottom: i < arr.length - 1 ? 10 : 0,
            marginBottom: i < arr.length - 1 ? 10 : 0,
            borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
          }}>
            <span style={{ color: 'rgba(238,240,248,0.45)', fontSize: 13 }}>{row.label}</span>
            <span style={{
              color: row.color ?? '#eef0f8', fontSize: 13, fontWeight: 600,
              fontFamily: row.mono ? 'DM Mono, monospace' : 'inherit',
            }}>{row.value}</span>
          </div>
        ))}
      </div>

      <button onClick={() => navigate('/wallet', { replace: true })} style={{
        padding: '14px 40px',
        background: 'linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)',
        border: 'none', borderRadius: 14,
        color: '#050c18', fontSize: 16, fontWeight: 700, cursor: 'pointer',
        boxShadow: '0 0 24px rgba(53,242,168,0.3)',
        animation: 'fadeUp 0.4s 0.5s ease both',
      }}>
        Back to Wallet
      </button>

      <p style={{
        color: 'rgba(238,240,248,0.2)', fontSize: 12, marginTop: 20,
        animation: 'fadeUp 0.4s 0.6s ease both',
      }}>
        Redirecting in a few seconds…
      </p>

      <style>{`
        @keyframes popIn { from{opacity:0;transform:scale(0.5)} to{opacity:1;transform:scale(1)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}