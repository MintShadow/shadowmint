import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

type RequestData = {
  id: string;
  amount: number;
  note: string | null;
  status: string;
  created_at: string;
  requester_id: string;
  requester?: { full_name: string | null; username: string | null };
};

export default function RequestReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [request, setRequest] = useState<RequestData | null>(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [action, setAction] = useState<'pay' | 'decline' | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login', { replace: true }); return; }

      const [reqRes, walletRes] = await Promise.all([
        supabase.from('payment_requests')
          .select('*, requester:requester_id(full_name, username)')
          .eq('id', id).eq('recipient_id', session.user.id).single(),
        supabase.from('wallets').select('balance').eq('user_id', session.user.id).single(),
      ]);

      if (!reqRes.data || reqRes.error) { navigate('/activity'); return; }
      if (reqRes.data.status !== 'pending') { navigate('/activity'); return; }

      setRequest(reqRes.data as any);
      setBalance(walletRes.data?.balance ?? 0);
      setLoading(false);
    };
    load();
  }, [id, navigate]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n);
  const fmtCents = (n: number) => fmt(n / 100);

  const handlePay = async () => {
    if (!request) return;
    setProcessing(true);
    setError('');
    setAction('pay');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');

      if (balance < request.amount) {
        throw new Error('Insufficient balance. You have ' + fmtCents(balance) + ' available.');
      }

      const senderId = session.user.id;
      const receiverId = request.requester_id;

      // Debit payer (recipient of request = the one paying)
      const { data: payerWallet } = await supabase.from('wallets').select('id, balance').eq('user_id', senderId).single();
      if (!payerWallet) throw new Error('Could not load wallet.');

      await supabase.from('wallets').update({ balance: payerWallet.balance - request.amount }).eq('id', payerWallet.id);

      // Record debit transaction
      await supabase.from('transactions').insert({
        user_id: senderId,
        wallet_id: payerWallet.id,
        type: 'debit',
        category: 'request',
        amount: request.amount,
        description: request.note || 'Payment request',
        counterparty_id: receiverId,
        status: 'completed',
      });

      // Credit requester
      const { data: receiverWallet } = await supabase.from('wallets').select('id, balance').eq('user_id', receiverId).single();
      if (receiverWallet) {
        await supabase.from('wallets').update({ balance: receiverWallet.balance + request.amount }).eq('id', receiverWallet.id);
        await supabase.from('transactions').insert({
          user_id: receiverId,
          wallet_id: receiverWallet.id,
          type: 'credit',
          category: 'request',
          amount: request.amount,
          description: request.note || 'Payment request fulfilled',
          counterparty_id: senderId,
          status: 'completed',
        });
      }

      // Mark request as paid
      await supabase.from('payment_requests').update({ status: 'paid' }).eq('id', request.id);

      navigate('/request-success', { state: { amount: request.amount, note: request.note, requester: (request as any).requester } });
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
      setProcessing(false);
      setAction(null);
    }
  };

  const handleDecline = async () => {
    if (!request) return;
    setProcessing(true);
    setAction('decline');

    await supabase.from('payment_requests').update({ status: 'declined' }).eq('id', request.id);
    navigate('/activity');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#060810', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 36, color: '#35f2a8' }}>✦</div>
      </div>
    );
  }

  if (!request) return null;

  const requester = (request as any).requester;
  const name = requester?.full_name || requester?.username || 'Someone';
  const hasEnough = balance >= request.amount;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 10%, rgba(246,166,35,0.07), transparent 50%), #060810',
      fontFamily: 'DM Sans, system-ui, sans-serif', color: '#eef0f8', paddingBottom: 40,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px 16px' }}>
        <button onClick={() => navigate('/activity')} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, width: 40, height: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#eef0f8', fontSize: 18,
        }}>←</button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Payment Request</h1>
      </div>

      <div style={{ padding: '8px 24px 40px' }}>
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12, padding: '12px 16px', color: '#f87171', fontSize: 14, marginBottom: 20,
          }}>{error}</div>
        )}

        {/* Requester card */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #92400e, #f6a623)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, color: '#fff',
            margin: '0 auto 14px',
            boxShadow: '0 0 24px rgba(246,166,35,0.25)',
          }}>{name[0].toUpperCase()}</div>
          <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>{name}</p>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(238,240,248,0.45)' }}>is requesting</p>
        </div>

        {/* Amount hero */}
        <div style={{
          background: 'linear-gradient(135deg, #78350f 0%, #92400e 50%, #b45309 100%)',
          borderRadius: 24, padding: '32px 28px', textAlign: 'center', marginBottom: 24,
          boxShadow: '0 8px 40px rgba(246,166,35,0.2)', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, margin: '0 0 8px' }}>Amount requested</p>
          <h2 style={{ color: '#fde68a', fontSize: 44, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-1px' }}>
            {fmtCents(request.amount)}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>AUD</p>
        </div>

        {/* Details */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, overflow: 'hidden', marginBottom: 16,
        }}>
          {[
            { label: 'From', value: name },
            { label: 'Amount', value: fmtCents(request.amount) },
            ...(request.note ? [{ label: 'Note', value: request.note }] : []),
          ].map((row, i, arr) => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 20px',
              borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              <span style={{ color: 'rgba(238,240,248,0.5)', fontSize: 14 }}>{row.label}</span>
              <span style={{ color: '#eef0f8', fontSize: 14, fontWeight: 600, maxWidth: '60%', textAlign: 'right' }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Balance check */}
        <div style={{
          background: hasEnough ? 'rgba(53,242,168,0.06)' : 'rgba(239,68,68,0.06)',
          border: '1px solid ' + (hasEnough ? 'rgba(53,242,168,0.15)' : 'rgba(239,68,68,0.2)'),
          borderRadius: 14, padding: '12px 16px', marginBottom: 28,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ color: 'rgba(238,240,248,0.5)', fontSize: 14 }}>Your balance</span>
          <span style={{ color: hasEnough ? '#35f2a8' : '#f87171', fontSize: 14, fontWeight: 700 }}>
            {fmtCents(balance)} {hasEnough ? '✓' : '- insufficient'}
          </span>
        </div>

        {/* Pay button */}
        <button
          onClick={handlePay}
          disabled={processing || !hasEnough}
          style={{
            width: '100%', padding: '16px', borderRadius: 14, border: 'none',
            background: !hasEnough
              ? 'rgba(255,255,255,0.06)'
              : processing && action === 'pay'
                ? 'rgba(53,242,168,0.35)'
                : 'linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)',
            color: !hasEnough ? 'rgba(238,240,248,0.3)' : '#050c18',
            fontSize: 16, fontWeight: 700,
            cursor: !hasEnough || processing ? 'not-allowed' : 'pointer',
            boxShadow: hasEnough && !processing ? '0 0 24px rgba(53,242,168,0.3)' : 'none',
            marginBottom: 12,
          }}
        >
          {processing && action === 'pay' ? 'Processing...' : 'Pay ' + fmtCents(request.amount)}
        </button>

        {/* Decline button */}
        <button
          onClick={handleDecline}
          disabled={processing}
          style={{
            width: '100%', padding: '16px', borderRadius: 14,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: processing && action === 'decline' ? 'rgba(248,113,113,0.4)' : '#f87171',
            fontSize: 16, fontWeight: 700, cursor: processing ? 'not-allowed' : 'pointer',
          }}
        >
          {processing && action === 'decline' ? 'Declining...' : 'Decline'}
        </button>
      </div>
    </div>
  );
}
