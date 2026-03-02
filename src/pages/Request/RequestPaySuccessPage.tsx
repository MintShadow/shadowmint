import { useNavigate, useLocation } from 'react-router-dom';

export default function RequestPaySuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { amount, note, requester } = location.state || {};
  const name = requester?.full_name || requester?.username || 'them';

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n / 100);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 30%, rgba(53,242,168,0.1), transparent 60%), #060810',
      fontFamily: 'DM Sans, system-ui, sans-serif', color: '#eef0f8',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 24px', textAlign: 'center',
    }}>
      <div style={{
        width: 96, height: 96, borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(53,242,168,0.2), rgba(24,200,122,0.2))',
        border: '2px solid rgba(53,242,168,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 44, marginBottom: 28,
        boxShadow: '0 0 40px rgba(53,242,168,0.2)',
      }}>✓</div>

      <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800 }}>Payment sent!</h1>
      <p style={{ margin: '0 0 4px', fontSize: 15, color: 'rgba(238,240,248,0.5)' }}>You paid</p>
      <p style={{ margin: '0 0 4px', fontSize: 36, fontWeight: 800, color: '#35f2a8' }}>{fmt(amount)}</p>
      <p style={{ margin: '0 0 40px', fontSize: 14, color: 'rgba(238,240,248,0.4)' }}>to {name}</p>

      {note && (
        <div style={{
          background: 'rgba(53,242,168,0.06)', border: '1px solid rgba(53,242,168,0.15)',
          borderRadius: 14, padding: '12px 20px', marginBottom: 32, maxWidth: 320,
        }}>
          <p style={{ margin: 0, color: 'rgba(238,240,248,0.5)', fontSize: 13 }}>"{note}"</p>
        </div>
      )}

      <button
        onClick={() => navigate('/wallet')}
        style={{
          width: '100%', maxWidth: 320, padding: '16px', borderRadius: 14, border: 'none',
          background: 'linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)',
          color: '#050c18', fontSize: 16, fontWeight: 700,
          cursor: 'pointer', boxShadow: '0 0 24px rgba(53,242,168,0.3)',
        }}
      >Back to Wallet</button>
    </div>
  );
}
