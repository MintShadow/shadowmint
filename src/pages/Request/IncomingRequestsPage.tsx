import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

type PaymentRequest = {
  id: string;
  amount: number;
  note: string | null;
  status: 'pending' | 'paid' | 'declined';
  created_at: string;
  requester_id: string;
  requester?: { full_name: string | null; username: string | null; avatar_url: string | null };
};

const fmt = (cents: number) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(cents / 100);

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const timeAgo = (s: string) => {
  const diff = Date.now() - new Date(s).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function IncomingRequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login', { replace: true }); return; }

      const { data } = await supabase
        .from('payment_requests')
        .select('*, requester:requester_id(full_name, username, avatar_url)')
        .eq('recipient_id', session.user.id)
        .order('created_at', { ascending: false });

      setRequests((data as any) ?? []);
      setLoading(false);
    };
    load();
  }, [navigate]);

  const displayed = filter === 'pending'
    ? requests.filter(r => r.status === 'pending')
    : requests;

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#060810', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid rgba(53,242,168,0.2)', borderTopColor: '#35f2a8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 70% 10%, rgba(246,166,35,0.06), transparent 50%), #060810',
      fontFamily: 'DM Sans, system-ui, sans-serif',
      color: '#eef0f8',
      paddingBottom: 100,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px 0' }}>
        <button
          onClick={() => navigate('/activity')}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#eef0f8', fontSize: 18, flexShrink: 0,
          }}
        >&#x2190;</button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Incoming Requests</h1>
          {pendingCount > 0 && (
            <p style={{ margin: 0, fontSize: 13, color: '#f6a623' }}>
              {pendingCount} awaiting your response
            </p>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ padding: '20px 24px 0' }}>
        <div style={{
          display: 'flex', gap: 0,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: 3, marginBottom: 20,
        }}>
          {(['pending', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                flex: 1, padding: '9px',
                background: filter === f ? 'rgba(53,242,168,0.12)' : 'transparent',
                border: filter === f ? '1px solid rgba(53,242,168,0.3)' : '1px solid transparent',
                borderRadius: 9,
                color: filter === f ? '#35f2a8' : 'rgba(238,240,248,0.45)',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {f === 'pending' ? 'Pending' : 'All'}
              {f === 'pending' && pendingCount > 0 && (
                <span style={{
                  background: '#f6a623', color: '#050c18',
                  fontSize: 10, fontWeight: 800,
                  minWidth: 16, height: 16, borderRadius: 999,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 3px',
                }}>{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 24px' }}>
        {displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              {filter === 'pending' ? '🎉' : '📩'}
            </div>
            <p style={{ color: 'rgba(238,240,248,0.5)', fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>
              {filter === 'pending' ? "You're all caught up!" : 'No requests yet'}
            </p>
            <p style={{ color: 'rgba(238,240,248,0.3)', fontSize: 14, margin: 0 }}>
              {filter === 'pending' ? 'No pending requests at the moment.' : 'Requests made to you will appear here.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {displayed.map(req => {
              const requester = (req as any).requester;
              const name = requester?.full_name || requester?.username || 'Someone';
              const initials = name[0].toUpperCase();
              const isPending = req.status === 'pending';

              const statusStyle = {
                pending:  { color: '#f6a623', bg: 'rgba(246,166,35,0.12)', label: 'Pending' },
                paid:     { color: '#35f2a8', bg: 'rgba(53,242,168,0.12)', label: 'Paid' },
                declined: { color: '#f87171', bg: 'rgba(239,68,68,0.12)', label: 'Declined' },
              }[req.status] ?? { color: '#f6a623', bg: 'rgba(246,166,35,0.12)', label: 'Pending' };

              return (
                <div
                  key={req.id}
                  onClick={() => isPending ? navigate('/requests/' + req.id) : undefined}
                  style={{
                    background: isPending ? 'rgba(246,166,35,0.04)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isPending ? 'rgba(246,166,35,0.2)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 18, padding: '18px 20px',
                    cursor: isPending ? 'pointer' : 'default',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => isPending && (e.currentTarget.style.background = 'rgba(246,166,35,0.08)')}
                  onMouseLeave={e => isPending && (e.currentTarget.style.background = 'rgba(246,166,35,0.04)')}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    {/* Avatar */}
                    {requester?.avatar_url ? (
                      <img src={requester.avatar_url} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(246,166,35,0.3)' }} />
                    ) : (
                      <div style={{
                        width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #92400e, #f6a623)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, fontWeight: 800, color: '#fff',
                        border: isPending ? '2px solid rgba(246,166,35,0.3)' : '2px solid transparent',
                      }}>{initials}</div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Name + amount row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <div>
                          <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{name}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(238,240,248,0.4)' }}>
                            {timeAgo(req.created_at)}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f6a623' }}>
                            {fmt(req.amount)}
                          </p>
                        </div>
                      </div>

                      {/* Note */}
                      {req.note && (
                        <div style={{
                          background: 'rgba(255,255,255,0.04)', borderRadius: 8,
                          padding: '7px 12px', marginTop: 10, marginBottom: 10,
                        }}>
                          <p style={{ margin: 0, fontSize: 13, color: 'rgba(238,240,248,0.55)', fontStyle: 'italic' }}>
                            "{req.note}"
                          </p>
                        </div>
                      )}

                      {/* Status + CTA */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: req.note ? 0 : 10 }}>
                        <span style={{
                          background: statusStyle.bg, color: statusStyle.color,
                          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                        }}>{statusStyle.label}</span>

                        {isPending && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={e => { e.stopPropagation(); navigate('/requests/' + req.id); }}
                              style={{
                                background: 'linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)',
                                border: 'none', borderRadius: 10,
                                padding: '8px 16px',
                                color: '#050c18', fontSize: 13, fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 0 16px rgba(53,242,168,0.3)',
                              }}
                            >Pay</button>
                            <button
                              onClick={async e => {
                                e.stopPropagation();
                                await supabase.from('payment_requests').update({ status: 'declined' }).eq('id', req.id);
                                setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'declined' } : r));
                              }}
                              style={{
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                                borderRadius: 10, padding: '8px 14px',
                                color: '#f87171', fontSize: 13, fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >Decline</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
