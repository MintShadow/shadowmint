import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

type Transaction = {
  id: string;
  type: 'credit' | 'debit';
  category: string;
  amount: number;
  description: string;
  created_at: string;
};

type PaymentRequest = {
  id: string;
  amount: number;
  note: string | null;
  status: 'pending' | 'paid' | 'declined';
  created_at: string;
  requester_id: string;
  recipient_id: string;
  requester?: { full_name: string | null; username: string | null };
  recipient?: { full_name: string | null; username: string | null };
};

export default function ActivityPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'requests' ? 'requests' : 'transactions';

  const [tab, setTab] = useState<'transactions' | 'requests'>(defaultTab as any);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login', { replace: true }); return; }
      setUserId(session.user.id);

      const [txRes, reqRes] = await Promise.all([
        supabase.from('transactions').select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false }),
        supabase.from('payment_requests')
          .select('*, requester:requester_id(full_name, username), recipient:recipient_id(full_name, username)')
          .or('requester_id.eq.' + session.user.id + ',recipient_id.eq.' + session.user.id)
          .order('created_at', { ascending: false }),
      ]);

      setTransactions(txRes.data ?? []);
      const reqs = (reqRes.data as any) ?? [];
      setRequests(reqs);
      setPendingCount(reqs.filter((r: PaymentRequest) => r.recipient_id === session.user.id && r.status === 'pending').length);
      setLoading(false);
    };
    load();
  }, [navigate]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n);
  const fmtCents = (n: number) => fmt(n / 100);
  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const categoryIcon: Record<string, string> = {
    transfer: '💸', deposit: '🏦', withdrawal: '🏧', request: '📩', fee: '💳', refund: '↩️',
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#060810', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 36, color: '#35f2a8' }}>✦</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#060810',
      fontFamily: 'DM Sans, system-ui, sans-serif', color: '#eef0f8', paddingBottom: 100,
    }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 0' }}>
        <h1 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 800 }}>Activity</h1>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 0,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, padding: 4, marginBottom: 24,
        }}>
          {(['transactions', 'requests'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '10px',
                background: tab === t ? 'rgba(53,242,168,0.12)' : 'transparent',
                border: tab === t ? '1px solid rgba(53,242,168,0.3)' : '1px solid transparent',
                borderRadius: 10,
                color: tab === t ? '#35f2a8' : 'rgba(238,240,248,0.45)',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {t === 'transactions' ? 'Transactions' : 'Requests'}
              {t === 'requests' && pendingCount > 0 && (
                <span style={{
                  background: '#f6a623', color: '#050c18',
                  fontSize: 10, fontWeight: 800,
                  width: 16, height: 16, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 24px' }}>

        {/* Transactions Tab */}
        {tab === 'transactions' && (
          transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>💸</div>
              <p style={{ color: 'rgba(238,240,248,0.45)', fontSize: 15 }}>No transactions yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {transactions.map(tx => (
                <div key={tx.id} onClick={() => navigate('/activity/' + tx.id)} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 14, padding: '14px 16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                      background: tx.type === 'credit' ? 'rgba(53,242,168,0.12)' : 'rgba(239,68,68,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}>{categoryIcon[tx.category] ?? '💳'}</div>
                    <div>
                      <p style={{ color: '#eef0f8', fontSize: 14, fontWeight: 500, margin: 0 }}>{tx.description}</p>
                      <p style={{ color: 'rgba(238,240,248,0.4)', fontSize: 12, margin: '2px 0 0' }}>{fmtDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <span style={{ color: tx.type === 'credit' ? '#35f2a8' : '#f87171', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
                    {tx.type === 'credit' ? '+' : '-'}{fmtCents(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )
        )}

        {/* Requests Tab */}
        {tab === 'requests' && (
          requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📩</div>
              <p style={{ color: 'rgba(238,240,248,0.45)', fontSize: 15 }}>No payment requests yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {requests.map(req => {
                const isIncoming = req.recipient_id === userId;
                const otherParty = isIncoming
                  ? (req as any).requester
                  : (req as any).recipient;
                const name = otherParty?.full_name || otherParty?.username || 'Someone';

                const statusStyle: Record<string, { color: string; bg: string; label: string }> = {
                  pending:  { color: '#f6a623', bg: 'rgba(246,166,35,0.12)', label: 'Pending' },
                  paid:     { color: '#35f2a8', bg: 'rgba(53,242,168,0.12)', label: 'Paid' },
                  declined: { color: '#f87171', bg: 'rgba(239,68,68,0.12)', label: 'Declined' },
                };
                const s = statusStyle[req.status] ?? statusStyle.pending;

                return (
                  <div
                    key={req.id}
                    onClick={() => isIncoming && req.status === 'pending' ? navigate('/requests/' + req.id) : undefined}
                    style={{
                      background: isIncoming && req.status === 'pending'
                        ? 'rgba(246,166,35,0.05)'
                        : 'rgba(255,255,255,0.03)',
                      border: isIncoming && req.status === 'pending'
                        ? '1px solid rgba(246,166,35,0.2)'
                        : '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 16, padding: '16px 18px',
                      display: 'flex', alignItems: 'center', gap: 14,
                      cursor: isIncoming && req.status === 'pending' ? 'pointer' : 'default',
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      background: isIncoming
                        ? 'linear-gradient(135deg, #92400e, #f6a623)'
                        : 'linear-gradient(135deg, #065f46, #35f2a8)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 800, color: '#fff',
                    }}>{name[0].toUpperCase()}</div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 600 }}>
                        {isIncoming
                          ? <><span style={{ color: '#f6a623' }}>{name}</span> requested from you</>
                          : <>You requested from <span style={{ color: '#35f2a8' }}>{name}</span></>
                        }
                      </p>
                      {req.note && (
                        <p style={{ margin: '0 0 2px', fontSize: 12, color: 'rgba(238,240,248,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          "{req.note}"
                        </p>
                      )}
                      <p style={{ margin: 0, fontSize: 11, color: 'rgba(238,240,248,0.3)' }}>{fmtDate(req.created_at)}</p>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: isIncoming ? '#f6a623' : '#eef0f8' }}>
                        {fmtCents(req.amount)}
                      </p>
                      <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999 }}>
                        {s.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
