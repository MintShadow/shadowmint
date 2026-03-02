import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n);

export default function RequestJust() {
  const navigate = useNavigate();
  const [fromEmail, setFromEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [requestedAmount, setRequestedAmount] = useState(0);

  const quickAmounts = [10, 20, 50, 100, 200, 500];

  const handleRequest = async () => {
    setError('');
    if (!fromEmail.trim()) { setError('Please enter the email of who you\'re requesting from.'); return; }
    if (!fromEmail.includes('@')) { setError('Please enter a valid email address.'); return; }
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) { setError('Please enter a valid amount.'); return; }
    if (amt < 1) { setError('Minimum request amount is $1.00.'); return; }
    if (amt > 10000) { setError('Maximum request amount is $10,000.'); return; }

    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate('/login', { replace: true }); return; }

    // Look up recipient user id by email
    const { data: recipientData, error: recipientErr } = await supabase
      .rpc('get_user_id_by_email', { email: fromEmail.trim().toLowerCase() });

    if (recipientErr || !recipientData || recipientData.length === 0) {
      setError('No ShadowMint account found with that email.');
      setLoading(false);
      return;
    }

    const recipientId = recipientData[0].id;

    if (recipientId === session.user.id) {
      setError('You can\'t request money from yourself.');
      setLoading(false);
      return;
    }

    const { error: insertErr } = await supabase.from('payment_requests').insert({
      requester_id: session.user.id,
      recipient_id: recipientId,
      amount: Math.round(amt * 100), // store in cents
      note: note.trim() || null,
      status: 'pending',
    });

    setLoading(false);

    if (insertErr) {
      setError(insertErr.message);
      return;
    }

    setRequestedAmount(amt);
    setSuccess(true);
  };

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 50% 30%, rgba(53,242,168,0.1), transparent 60%), #060810',
        fontFamily: 'DM Sans, system-ui, sans-serif',
        color: '#eef0f8',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '0 24px', textAlign: 'center',
      }}>
        {/* Animated success icon */}
        <div style={{
          width: 96, height: 96, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(53,242,168,0.2), rgba(24,200,122,0.2))',
          border: '2px solid rgba(53,242,168,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 44, marginBottom: 28,
          animation: 'popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
          boxShadow: '0 0 40px rgba(53,242,168,0.2)',
        }}>💸</div>

        <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800 }}>Request Sent!</h1>
        <p style={{ margin: '0 0 4px', fontSize: 15, color: 'rgba(238,240,248,0.5)' }}>
          You requested
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 36, fontWeight: 800, color: '#35f2a8' }}>
          {fmt(requestedAmount)}
        </p>
        <p style={{ margin: '0 0 40px', fontSize: 14, color: 'rgba(238,240,248,0.4)' }}>
          from {fromEmail}
        </p>

        <div style={{
          background: 'rgba(53,242,168,0.06)', border: '1px solid rgba(53,242,168,0.15)',
          borderRadius: 14, padding: '14px 20px', marginBottom: 36, maxWidth: 320,
        }}>
          <p style={{ margin: 0, color: 'rgba(238,240,248,0.5)', fontSize: 13, lineHeight: 1.6 }}>
            They'll receive a notification and can approve or decline your request.
          </p>
        </div>

        <button
          onClick={() => navigate('/wallet')}
          style={{
            width: '100%', maxWidth: 320, padding: '16px',
            background: 'linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)',
            border: 'none', borderRadius: 14,
            color: '#050c18', fontSize: 16, fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 0 24px rgba(53,242,168,0.3)',
          }}
        >Back to Wallet</button>

        <button
          onClick={() => { setSuccess(false); setFromEmail(''); setAmount(''); setNote(''); }}
          style={{
            marginTop: 14, background: 'none', border: 'none',
            color: 'rgba(238,240,248,0.4)', fontSize: 14, cursor: 'pointer',
          }}
        >Make another request</button>

        <style>{`@keyframes popIn{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 75% 15%, rgba(53,242,168,0.06), transparent 50%), #060810',
      fontFamily: 'DM Sans, system-ui, sans-serif',
      color: '#eef0f8',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px 16px' }}>
        <button
          onClick={() => navigate('/wallet')}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#eef0f8', fontSize: 18,
          }}
        >←</button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Request Money</h1>
      </div>

      <div style={{ padding: '8px 24px 40px' }}>
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12, padding: '12px 16px',
            color: '#f87171', fontSize: 14, marginBottom: 20,
          }}>{error}</div>
        )}

        {/* Request from */}
        <div style={{ marginBottom: 20 }}>
          <label style={{
            color: 'rgba(238,240,248,0.5)', fontSize: 12, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10,
          }}>
            Request From
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              fontSize: 16, opacity: 0.5,
            }}>✉</span>
            <input
              type="email"
              value={fromEmail}
              onChange={e => setFromEmail(e.target.value)}
              placeholder="their@email.com"
              style={{
                width: '100%', padding: '13px 16px 13px 40px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 14, color: '#eef0f8', fontSize: 15,
                outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(53,242,168,0.45)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>
        </div>

        {/* Amount */}
        <div style={{ marginBottom: 20 }}>
          <label style={{
            color: 'rgba(238,240,248,0.5)', fontSize: 12, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10,
          }}>
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
                outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
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
                  borderRadius: 999,
                  color: amount === String(q) ? '#35f2a8' : 'rgba(238,240,248,0.6)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                }}
              >${q}</button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div style={{ marginBottom: 32 }}>
          <label style={{
            color: 'rgba(238,240,248,0.5)', fontSize: 12, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10,
          }}>
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
              outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
            }}
            onFocus={e => (e.target.style.borderColor = 'rgba(53,242,168,0.45)')}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
        </div>

        {/* Info card */}
        <div style={{
          background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)',
          borderRadius: 14, padding: '14px 16px', marginBottom: 28,
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
          <p style={{ margin: 0, color: 'rgba(238,240,248,0.45)', fontSize: 13, lineHeight: 1.6 }}>
            The other person will be notified and can choose to pay or decline your request.
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={handleRequest}
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
          {loading ? 'Sending Request…' : 'Send Request 💸'}
        </button>
      </div>
    </div>
  );
}
