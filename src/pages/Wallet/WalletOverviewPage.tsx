import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  created_at: string;
  requester_id: string;
  requester?: { full_name: string | null; username: string | null; avatar_url: string | null };
};

type Profile = {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

const fmt = (cents: number) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(cents / 100);

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const categoryIcon: Record<string, string> = {
  transfer: '💸', deposit: '🏦', withdrawal: '🏧', request: '📩', fee: '💳', refund: '↩',
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

// ── Send SVG ─────────────────────────────────────────────
const SendSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RequestSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12l7 7 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DepositSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 19V5M5 12l7-7 7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 20h14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const WithdrawSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="6" width="20" height="14" rx="3" stroke="white" strokeWidth="2"/>
    <path d="M2 10h20" stroke="white" strokeWidth="2"/>
    <circle cx="17" cy="15" r="1.5" fill="white"/>
  </svg>
);

export default function WalletOverviewPage() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PaymentRequest[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login', { replace: true }); return; }

      const [walletRes, txRes, reqRes, profileRes] = await Promise.all([
        supabase.from('wallets').select('balance').eq('user_id', session.user.id).single(),
        supabase.from('transactions').select('*').eq('user_id', session.user.id)
          .order('created_at', { ascending: false }).limit(8),
        supabase.from('payment_requests')
          .select('*, requester:requester_id(full_name, username, avatar_url)')
          .eq('recipient_id', session.user.id).eq('status', 'pending')
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('full_name, username, avatar_url')
          .eq('id', session.user.id).single(),
      ]);

      setBalance(walletRes.data?.balance ?? 0);
      setTransactions(txRes.data ?? []);
      setPendingRequests((reqRes.data as any) ?? []);
      setProfile(profileRes.data ?? null);
      setLoading(false);
    };
    load();
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#060810', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(53,242,168,0.2)', borderTopColor: '#35f2a8', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: 'rgba(238,240,248,0.3)', fontSize: 13 }}>Loading wallet...</p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const displayName = profile?.full_name || profile?.username || 'there';
  const firstName = displayName.split(' ')[0];

  const ACTIONS = [
    { label: 'Send',     path: '/send',         icon: <SendSVG />,     grad: 'linear-gradient(135deg, #0d7a5f, #35f2a8)' },
    { label: 'Request',  path: '/request',      icon: <RequestSVG />,  grad: 'linear-gradient(135deg, #92400e, #f6a623)' },
    { label: 'Deposit',  path: '/deposit/bank', icon: <DepositSVG />,  grad: 'linear-gradient(135deg, #1e3a8a, #60a5fa)' },
    { label: 'Withdraw', path: '/withdraw',     icon: <WithdrawSVG />, grad: 'linear-gradient(135deg, #581c87, #a78bfa)' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 30% 10%, rgba(53,242,168,0.07), transparent 55%), #060810',
      fontFamily: 'DM Sans, system-ui, sans-serif',
      color: '#eef0f8',
      paddingBottom: 100,
    }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(53,242,168,0.3)' }} />
          ) : (
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #065f46, #35f2a8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 800, color: '#fff',
              border: '2px solid rgba(53,242,168,0.3)',
            }}>{firstName[0].toUpperCase()}</div>
          )}
          <div>
            <p style={{ color: 'rgba(238,240,248,0.4)', fontSize: 12, margin: 0 }}>{greeting()}</p>
            <p style={{ color: '#eef0f8', fontSize: 15, fontWeight: 700, margin: '1px 0 0' }}>{firstName} 👋</p>
          </div>
        </div>

        {/* Notification bell */}
        <button
          onClick={() => navigate('/activity?tab=requests')}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="rgba(238,240,248,0.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="rgba(238,240,248,0.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {pendingRequests.length > 0 && (
            <div style={{
              position: 'absolute', top: -4, right: -4,
              background: '#f6a623', color: '#050c18',
              fontSize: 9, fontWeight: 800,
              minWidth: 14, height: 14, borderRadius: 999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 3px',
              boxShadow: '0 0 8px rgba(246,166,35,0.6)',
            }}>{pendingRequests.length > 9 ? '9+' : pendingRequests.length}</div>
          )}
        </button>
      </div>

      {/* Balance Card */}
      <div style={{
        margin: '16px 24px 0',
        background: 'linear-gradient(135deg, #065f46 0%, #0d7a5f 40%, #10b981 100%)',
        borderRadius: 24, padding: '28px 28px 24px',
        boxShadow: '0 8px 40px rgba(16,185,129,0.25)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: 40, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, margin: '0 0 10px', fontWeight: 500 }}>Available Balance</p>
            <h2 style={{ color: '#fff', fontSize: 40, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-1.5px' }}>
              {balanceVisible ? fmt(balance ?? 0) : '••••••'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, margin: 0 }}>ShadowMint Wallet</p>
          </div>
          <button
            onClick={() => setBalanceVisible(v => !v)}
            style={{
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 10, padding: '7px 12px',
              color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', flexShrink: 0,
            }}
          >{balanceVisible ? 'Hide' : 'Show'}</button>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, margin: '20px 24px 0' }}>
        {ACTIONS.map(action => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 18, padding: '16px 8px 14px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: action.grad,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}>{action.icon}</div>
            <span style={{ color: 'rgba(238,240,248,0.6)', fontSize: 11, fontWeight: 600 }}>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Pending requests banner */}
      {pendingRequests.length > 0 && !bannerDismissed && (
        <div style={{ margin: '20px 24px 0' }}>
          <div
            style={{
              background: 'rgba(246,166,35,0.07)',
              border: '1px solid rgba(246,166,35,0.25)',
              borderRadius: 20, overflow: 'hidden',
            }}
          >
            {/* Banner header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  background: '#f6a623', color: '#050c18',
                  fontSize: 10, fontWeight: 800,
                  minWidth: 18, height: 18, borderRadius: 999,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px',
                  boxShadow: '0 0 8px rgba(246,166,35,0.5)',
                  animation: 'pulse 2s ease-in-out infinite',
                }}>{pendingRequests.length}</div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#f6a623' }}>
                  {pendingRequests.length === 1 ? 'Payment request' : 'Payment requests'} waiting
                </p>
              </div>
              <button
                onClick={() => setBannerDismissed(true)}
                style={{ background: 'none', border: 'none', color: 'rgba(238,240,248,0.3)', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: 0 }}
              >&#x2715;</button>
            </div>

            {/* Request previews */}
            {pendingRequests.slice(0, 2).map((req, i) => {
              const requester = (req as any).requester;
              const name = requester?.full_name || requester?.username || 'Someone';
              return (
                <div
                  key={req.id}
                  onClick={() => navigate('/requests/' + req.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 18px',
                    borderTop: '1px solid rgba(246,166,35,0.12)',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(246,166,35,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {requester?.avatar_url ? (
                    <img src={requester.avatar_url} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #92400e, #f6a623)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 800, color: '#fff',
                    }}>{name[0].toUpperCase()}</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                      <span style={{ color: '#f6a623' }}>{name}</span> is requesting
                    </p>
                    {req.note && (
                      <p style={{ margin: '1px 0 0', fontSize: 12, color: 'rgba(238,240,248,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        "{req.note}"
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#f6a623' }}>{fmt(req.amount)}</p>
                    <span style={{ fontSize: 11, color: 'rgba(238,240,248,0.35)' }}>Tap to review ›</span>
                  </div>
                </div>
              );
            })}

            {/* See all */}
            {pendingRequests.length > 2 && (
              <div
                onClick={() => navigate('/requests')}
                style={{
                  padding: '10px 18px', borderTop: '1px solid rgba(246,166,35,0.12)',
                  textAlign: 'center', cursor: 'pointer',
                }}
              >
                <span style={{ color: '#f6a623', fontSize: 13, fontWeight: 600 }}>
                  See {pendingRequests.length - 2} more ›
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div style={{ margin: '24px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ color: '#eef0f8', fontSize: 17, fontWeight: 700, margin: 0 }}>Recent Activity</h3>
          {transactions.length > 0 && (
            <button onClick={() => navigate('/activity')} style={{
              background: 'none', border: 'none', color: '#35f2a8', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>See all ›</button>
          )}
        </div>

        {transactions.length === 0 ? (
          // Rich empty state
          <div style={{
            background: 'rgba(53,242,168,0.03)', border: '1px solid rgba(53,242,168,0.1)',
            borderRadius: 20, overflow: 'hidden',
          }}>
            <div style={{ padding: '36px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
              <p style={{ color: '#eef0f8', fontSize: 16, fontWeight: 700, margin: '0 0 6px' }}>Your wallet is ready</p>
              <p style={{ color: 'rgba(238,240,248,0.4)', fontSize: 13, margin: '0 0 24px', lineHeight: 1.6 }}>
                Make your first transaction to get started.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button
                  onClick={() => navigate('/deposit/bank')}
                  style={{
                    background: 'linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)',
                    border: 'none', borderRadius: 12, padding: '10px 20px',
                    color: '#050c18', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 0 16px rgba(53,242,168,0.3)',
                  }}
                >Add money</button>
                <button
                  onClick={() => navigate('/send')}
                  style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, padding: '10px 20px',
                    color: 'rgba(238,240,248,0.7)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >Send money</button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {transactions.map(tx => (
              <div
                key={tx.id}
                onClick={() => navigate('/activity/' + tx.id)}
                style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 16, padding: '14px 16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                    background: tx.type === 'credit' ? 'rgba(53,242,168,0.12)' : 'rgba(239,68,68,0.12)',
                    border: `1px solid ${tx.type === 'credit' ? 'rgba(53,242,168,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  }}>{categoryIcon[tx.category] ?? (tx.type === 'credit' ? '↓' : '↑')}</div>
                  <div>
                    <p style={{ color: '#eef0f8', fontSize: 14, fontWeight: 600, margin: 0 }}>{tx.description}</p>
                    <p style={{ color: 'rgba(238,240,248,0.35)', fontSize: 12, margin: '2px 0 0' }}>{fmtDate(tx.created_at)}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: tx.type === 'credit' ? '#35f2a8' : '#f87171', fontSize: 15, fontWeight: 700, margin: 0 }}>
                    {tx.type === 'credit' ? '+' : '-'}{fmt(tx.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 8px rgba(246,166,35,0.5); }
          50% { box-shadow: 0 0 16px rgba(246,166,35,0.9); }
        }
      `}</style>
    </div>
  );
}
