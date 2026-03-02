import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

export default function SendReviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { recipientEmail, amount, note } = location.state || {};
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n);

  // Guard: if no state, go back
  if (!recipientEmail || !amount) {
    navigate('/send');
    return null;
  }

  const handleConfirm = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login', { replace: true }); return; }

      const senderId = session.user.id;
      const amountCents = Math.round(amount * 100);

      // 1. Look up recipient
      const { data: recipientProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', (await supabase.from('profiles').select('id')).data?.[0]?.id ?? '')
        .single();

      // Find recipient by email via auth (we store email in auth, look up by joining)
      const { data: recipientAuth } = await supabase
        .rpc('get_user_id_by_email', { email: recipientEmail })
        .single();

      // 2. Debit sender wallet
      const { data: senderWallet, error: walletErr } = await supabase
        .from('wallets').select('id, balance').eq('user_id', senderId).single();
      if (walletErr || !senderWallet) throw new Error('Could not load your wallet.');
      if (senderWallet.balance < amountCents) throw new Error('Insufficient balance.');

      const { error: debitErr } = await supabase
        .from('wallets')
        .update({ balance: senderWallet.balance - amountCents })
        .eq('id', senderWallet.id);
      if (debitErr) throw new Error('Failed to debit your wallet.');

      // 3. Record debit transaction for sender
      await supabase.from('transactions').insert({
        user_id: senderId,
        wallet_id: senderWallet.id,
        type: 'debit',
        category: 'transfer',
        amount: amountCents,
        description: note || `Sent to ${recipientEmail}`,
        counterparty_email: recipientEmail,
        counterparty_id: recipientAuth?.id ?? null,
        status: 'completed',
      });

      // 4. If recipient exists in our system, credit their wallet too
      if (recipientAuth?.id) {
        const { data: recipientWallet } = await supabase
          .from('wallets').select('id, balance').eq('user_id', recipientAuth.id).single();
        if (recipientWallet) {
          await supabase.from('wallets')
            .update({ balance: recipientWallet.balance + amountCents })
            .eq('id', recipientWallet.id);

          await supabase.from('transactions').insert({
            user_id: recipientAuth.id,
            wallet_id: recipientWallet.id,
            type: 'credit',
            category: 'transfer',
            amount: amountCents,
            description: note || `Received from ${session.user.email}`,
            counterparty_email: session.user.email,
            counterparty_id: senderId,
            status: 'completed',
          });
        }
      }

      navigate('/send/success', {
        replace: true,
        state: { recipientEmail, amount, note }
      });
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
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
          onClick={() => navigate('/send')}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#eef0f8', fontSize: 18,
          }}
        >←</button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Review Transfer</h1>
      </div>

      <div style={{ padding: '8px 24px 24px' }}>
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12, padding: '12px 16px',
            color: '#f87171', fontSize: 14, marginBottom: 20,
          }}>{error}</div>
        )}

        {/* Amount hero */}
        <div style={{
          background: 'linear-gradient(135deg, #065f46 0%, #0d7a5f 40%, #10b981 100%)',
          borderRadius: 24, padding: '32px 28px',
          textAlign: 'center', marginBottom: 24,
          boxShadow: '0 8px 40px rgba(16,185,129,0.25)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -30, right: -30,
            width: 100, height: 100, borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
          }} />
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: '0 0 8px' }}>Sending</p>
          <h2 style={{ color: '#fff', fontSize: 42, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-1px' }}>
            {fmt(amount)}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>AUD</p>
        </div>

        {/* Details card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, overflow: 'hidden',
          marginBottom: 24,
        }}>
          {[
            { label: 'To', value: recipientEmail },
            { label: 'Amount', value: fmt(amount) },
            { label: 'Fee', value: 'Free' },
            ...(note ? [{ label: 'Note', value: note }] : []),
          ].map((row, i, arr) => (
            <div
              key={row.label}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 20px',
                borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}
            >
              <span style={{ color: 'rgba(238,240,248,0.5)', fontSize: 14 }}>{row.label}</span>
              <span style={{
                color: row.label === 'Fee' ? '#35f2a8' : '#eef0f8',
                fontSize: 14, fontWeight: 600, maxWidth: '60%',
                textAlign: 'right', wordBreak: 'break-all',
              }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px',
          background: 'rgba(53,242,168,0.06)',
          border: '1px solid rgba(53,242,168,0.15)',
          borderRadius: 16, marginBottom: 32,
        }}>
          <span style={{ color: '#eef0f8', fontSize: 16, fontWeight: 600 }}>Total</span>
          <span style={{ color: '#35f2a8', fontSize: 20, fontWeight: 800 }}>{fmt(amount)}</span>
        </div>

        <button
          onClick={handleConfirm}
          disabled={loading}
          style={{
            width: '100%', padding: '16px',
            background: loading ? 'rgba(53,242,168,0.35)' : 'linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)',
            border: 'none', borderRadius: 14,
            color: '#050c18', fontSize: 16, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 0 24px rgba(53,242,168,0.3)',
          }}
        >
          {loading ? 'Sending…' : 'Confirm & Send'}
        </button>

        <p style={{ textAlign: 'center', color: 'rgba(238,240,248,0.35)', fontSize: 13, marginTop: 16 }}>
          This action cannot be undone
        </p>
      </div>
    </div>
  );
}