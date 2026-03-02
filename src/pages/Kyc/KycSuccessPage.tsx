import { useNavigate } from 'react-router-dom';

export default function KycSuccessPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 40%, rgba(53,242,168,0.1), transparent 60%), #060810',
      fontFamily: 'DM Sans, system-ui, sans-serif', color: '#eef0f8',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', textAlign: 'center',
    }}>
      <div style={{
        width: 110, height: 110, borderRadius: '50%',
        background: 'linear-gradient(135deg, #065f46, #35f2a8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 50, marginBottom: 28,
        boxShadow: '0 0 60px rgba(53,242,168,0.45)',
        animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
      }}>✓</div>

      <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 12px',
        animation: 'fadeUp 0.4s 0.2s ease both' }}>
        Identity Verified!
      </h1>
      <p style={{ color: 'rgba(238,240,248,0.55)', fontSize: 15, margin: '0 0 32px',
        maxWidth: 280, lineHeight: 1.6, animation: 'fadeUp 0.4s 0.3s ease both' }}>
        Your identity has been successfully verified. Your account is now fully active.
      </p>

      {/* Perks unlocked */}
      <div style={{
        background: 'rgba(53,242,168,0.06)', border: '1px solid rgba(53,242,168,0.2)',
        borderRadius: 20, padding: '20px 24px', width: '100%', maxWidth: 320,
        marginBottom: 32, animation: 'fadeUp 0.4s 0.4s ease both',
      }}>
        <p style={{ color: '#35f2a8', fontWeight: 700, fontSize: 13,
          textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>
          Now unlocked
        </p>
        {[
          { icon: '💸', label: 'Send up to $10,000/day' },
          { icon: '🏦', label: 'Withdraw to bank accounts' },
          { icon: '📈', label: 'Higher transaction limits' },
          { icon: '🪪', label: 'Full account protection' },
        ].map((perk, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            paddingBottom: i < 3 ? 12 : 0, marginBottom: i < 3 ? 12 : 0,
            borderBottom: i < 3 ? '1px solid rgba(53,242,168,0.1)' : 'none',
          }}>
            <span style={{ fontSize: 20 }}>{perk.icon}</span>
            <span style={{ color: '#eef0f8', fontSize: 14, fontWeight: 500 }}>{perk.label}</span>
          </div>
        ))}
      </div>

      <button onClick={() => navigate('/wallet', { replace: true })} style={{
        padding: '14px 40px', borderRadius: 14, border: 'none',
        background: 'linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)',
        color: '#050c18', fontSize: 16, fontWeight: 700, cursor: 'pointer',
        boxShadow: '0 0 28px rgba(53,242,168,0.35)',
        animation: 'fadeUp 0.4s 0.5s ease both',
      }}>Go to Wallet 🏠</button>

      <style>{`
        @keyframes popIn{from{opacity:0;transform:scale(0.5)}to{opacity:1;transform:scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}