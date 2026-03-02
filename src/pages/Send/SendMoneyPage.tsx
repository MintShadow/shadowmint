import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

export default function SendMoneyPage() {
  const navigate = useNavigate();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const quickAmounts = [10, 20, 50, 100, 200, 500];

  const handleContinue = async () => {
    setError('');
    if (!recipientEmail.trim()) { setError('Please enter a recipient email.'); return; }
    if (!recipientEmail.includes('@')) { setError('Please enter a valid email address.'); return; }
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) { setError('Please enter a valid amount.'); return; }
    if (amt < 1) { setError('Minimum send amount is $1.00.'); return; }
    if (amt > 10000) { setError('Maximum send amount is $10,000.'); return; }

    setLoading(true);
    // Check sender balance
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate('/login', { replace: true }); return; }

    const { data: wallet } = await supabase
      .from('wallets').select('balance').eq('user_id', session.user.id).single();

    const balanceDollars = (wallet?.balance ?? 0) / 100;
    if (amt > balanceDollars) {
      setError(`Insufficient balance. You have ${new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(balanceDollars)} available.`);
      setLoading(false);
      return;
    }
    setLoading(false);

    // Pass data to review page via state
    navigate('/send/review', {
      state: { recipientEmail: recipientEmail.trim(), amount: amt, note: note.trim() }
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 25% 15%, rgba(53,242,168,0.07), transparent 50%), #060810',
      fontFamily: 'DM Sans, system-ui, sans-serif',
      color: '#eef0f8',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '20px 24px 16px',
      }}>
        <button
          onClick={() => navigate('/wallet')}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#eef0f8', fontSize: 18,
          }}
        >←</button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Send Money</h1>
      </div>

      <div style={{ padding: '8px 24px 24px' }}>
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12, padding: '12px 16px',
            color: '#f87171', fontSize: 14, marginBottom: 20,
          }}>{error}</div>
        )}

        {/* Recipient */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ color: 'rgba(238,240,248,0.5)', fontSize: 12, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10 }}>
            Recipient
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              fontSize: 16, opacity: 0.5,
            }}>✉</span>
            <input
              type="email"
              value={recipientEmail}
              onChange={e => setRecipientEmail(e.target.value)}
              placeholder="their@email.com"
              style={{
                width: '100%', padding: '13px 16px 13px 40px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 14, color: '#eef0f8', fontSize: 15,
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(53,242,168,0.45)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>
        </div>

        {/* Amount */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ color: 'rgba(238,240,248,0.5)', fontSize: 12, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10 }}>
            Amount (AUD)
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
              fontSize: 18, fontWeight: 700, color: '#35f2a8',
            }}>$</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              min="1"
              step="0.01"
              style={{
                width: '100%', padding: '16px 16px 16px 32px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 14, color: '#eef0f8',
                fontSize: 28, fontWeight: 700,
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(53,242,168,0.45)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          {/* Quick amounts */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {quickAmounts.map(q => (
              <button
                key={q}
                onClick={() => setAmount(String(q))}
                style={{
                  padding: '7px 14px',
                  background: amount === String(q) ? 'rgba(53,242,168,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${amount === String(q) ? 'rgba(53,242,168,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 999, color: amount === String(q) ? '#35f2a8' : 'rgba(238,240,248,0.6)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >${q}</button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div style={{ marginBottom: 32 }}>
          <label style={{ color: 'rgba(238,240,248,0.5)', fontSize: 12, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10 }}>
            Note <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
          </label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="What's it for?"
            maxLength={100}
            style={{
              width: '100%', padding: '13px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14, color: '#eef0f8', fontSize: 15,
              outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => (e.target.style.borderColor = 'rgba(53,242,168,0.45)')}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
        </div>

        {/* CTA */}
        <button
          onClick={handleContinue}
          disabled={loading}
          style={{
            width: '100%', padding: '16px',
            background: loading ? 'rgba(53,242,168,0.35)' : 'linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)',
            border: 'none', borderRadius: 14,
            color: '#050c18', fontSize: 16, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 0 24px rgba(53,242,168,0.3)',
            transition: 'all 0.2s',
          }}
        >
          {loading ? 'Checking…' : 'Review Transfer →'}
        </button>
      </div>
    </div>
  );
}