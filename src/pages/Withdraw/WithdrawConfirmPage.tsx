import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

export default function WithdrawConfirmPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { amount, account, saveAccount } = location.state || {};
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n);

  if (!amount || !account) { navigate('/withdraw'); return null; }

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login', { replace: true }); return; }

      const amountCents = Math.round(amount * 100);

      // 1. Check balance again
      const { data: wallet, error: walletErr } = await supabase
        .from('wallets').select('id, balance').eq('user_id', session.user.id).single();
      if (walletErr || !wallet) throw new Error('Could not load your wallet.');
      if (wallet.balance < amountCents) throw new Error('Insufficient balance.');

      // 2. Debit wallet
      const { error: debitErr } = await supabase
        .from('wallets').update({ balance: wallet.balance - amountCents }).eq('id', wallet.id);
      if (debitErr) throw new Error('Failed to process withdrawal.');

      // 3. Save bank account if new
      if (account.id === 'new' && saveAccount) {
        await supabase.from('bank_accounts').insert({
          user_id: session.user.id,
          account_name: account.account_name,
          bsb: account.bsb,
          account_number: account.account_number,
          bank_name: account.bank_name,
          is_default: false,
        });
      }

      // 4. Record transaction
      await supabase.from('transactions').insert({
        user_id: session.user.id,
        wallet_id: wallet.id,
        type: 'debit',
        category: 'withdrawal',
        amount: amountCents,
        description: `Withdrawal to ${account.account_name}`,
        reference: account.bsb + ' ' + account.account_number,
        status: 'processing',
      });

      navigate('/withdraw/success', {
        replace: true,
        state: { amount, account },
      });
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 25% 15%, rgba(53,242,168,0.06), transparent 50%), #060810',
      fontFamily: 'DM Sans, system-ui, sans-serif', color: '#eef0f8',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px 16px' }}>
        <button onClick={() => navigate('/withdraw')} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, width: 40, height: 40, display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', color: '#eef0f8', fontSize: 18,
        }}>←</button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Confirm Withdrawal</h1>
      </div>

      <div style={{ padding: '8px 24px 32px' }}>
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12, padding: '12px 16px', color: '#f87171', fontSize: 14, marginBottom: 20,
          }}>{error}</div>
        )}

        {/* Amount hero */}
        <div style={{
          background: 'linear-gradient(135deg, #1c1a06 0%, #3b350a 40%, #78610d 100%)',
          borderRadius: 24, padding: '32px 28px', textAlign: 'center', marginBottom: 24,
          boxShadow: '0 8px 40px rgba(246,166,35,0.15)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -20, right: -20,
            width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
          }} />
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, margin: '0 0 8px' }}>Withdrawing</p>
          <h2 style={{ color: '#fff', fontSize: 42, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-1px' }}>
            {fmt(amount)}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, margin: 0 }}>AUD</p>
        </div>

        {/* Details */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, overflow: 'hidden', marginBottom: 16,
        }}>
          {[
            { label: 'Account Name', value: account.account_name },
            { label: 'Bank',         value: account.bank_name || '—' },
            { label: 'BSB',          value: account.bsb, mono: true },
            { label: 'Account No.',  value: account.account_number, mono: true },
            { label: 'Amount',       value: fmt(amount) },
            { label: 'Fee',          value: 'Free', green: true },
            { label: 'Processing',   value: '1–2 business days' },
          ].map((row, i, arr) => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '15px 20px',
              borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <span style={{ color: 'rgba(238,240,248,0.45)', fontSize: 13 }}>{row.label}</span>
              <span style={{
                color: row.green ? '#35f2a8' : '#eef0f8',
                fontSize: 13, fontWeight: 600,
                fontFamily: row.mono ? 'DM Mono, monospace' : 'inherit',
              }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px',
          background: 'rgba(246,166,35,0.08)', border: '1px solid rgba(246,166,35,0.2)',
          borderRadius: 16, marginBottom: 32,
        }}>
          <span style={{ color: '#eef0f8', fontSize: 16, fontWeight: 600 }}>You'll receive</span>
          <span style={{ color: '#f6a623', fontSize: 20, fontWeight: 800 }}>{fmt(amount)}</span>
        </div>

        <button onClick={handleConfirm} disabled={loading} style={{
          width: '100%', padding: '16px',
          background: loading ? 'rgba(53,242,168,0.35)' : 'linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)',
          border: 'none', borderRadius: 14,
          color: '#050c18', fontSize: 16, fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 0 24px rgba(53,242,168,0.3)',
        }}>
          {loading ? 'Processing…' : 'Confirm Withdrawal'}
        </button>

        <p style={{ textAlign: 'center', color: 'rgba(238,240,248,0.3)', fontSize: 13, marginTop: 16 }}>
          Funds will arrive in 1–2 business days
        </p>
      </div>
    </div>
  );
}