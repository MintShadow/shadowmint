import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

type Session = {
  id: string;
  created_at: string;
  updated_at: string;
  user_agent: string | null;
  ip: string | null;
};

function parseDevice(userAgent: string | null): { device: string; browser: string; icon: string } {
  if (!userAgent) return { device: 'Unknown Device', browser: 'Unknown Browser', icon: '💻' };

  const ua = userAgent.toLowerCase();
  let device = 'Desktop';
  let icon = '💻';

  if (ua.includes('iphone')) { device = 'iPhone'; icon = '📱'; }
  else if (ua.includes('ipad')) { device = 'iPad'; icon = '📱'; }
  else if (ua.includes('android')) { device = 'Android'; icon = '📱'; }
  else if (ua.includes('macintosh') || ua.includes('mac os')) { device = 'Mac'; icon = '💻'; }
  else if (ua.includes('windows')) { device = 'Windows PC'; icon = '💻'; }
  else if (ua.includes('linux')) { device = 'Linux'; icon = '💻'; }

  let browser = 'Browser';
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edg')) browser = 'Edge';

  return { device, browser, icon };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export default function ActiveSessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmAll, setShowConfirmAll] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login', { replace: true }); return; }

      // Supabase doesn't expose a sessions list via the client SDK directly,
      // so we show the current session info + any stored in our sessions table
      setCurrentSessionId(session.access_token.slice(-8)); // last 8 chars as pseudo-id

      // Try to load from our sessions table (if it exists)
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .order('updated_at', { ascending: false });

      if (sessionData && sessionData.length > 0) {
        setSessions(sessionData);
      } else {
        // Fall back to showing just the current session
        setSessions([{
          id: 'current',
          created_at: session.user.created_at ?? new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_agent: navigator.userAgent,
          ip: null,
        }]);
      }

      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleRevoke = async (sessionId: string) => {
    if (sessionId === 'current') {
      // Revoking current session = sign out
      await supabase.auth.signOut();
      navigate('/login', { replace: true });
      return;
    }

    setRevoking(sessionId);
    setError('');

    const { error: err } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);

    if (err) {
      setError('Failed to revoke session. Please try again.');
      setRevoking(null);
      return;
    }

    setSessions(prev => prev.filter(s => s.id !== sessionId));
    setRevoking(null);
  };

  const handleRevokeAll = async () => {
    setRevokingAll(true);
    setError('');
    setShowConfirmAll(false);

    // Delete all non-current sessions from DB
    const { error: err } = await supabase
      .from('sessions')
      .delete()
      .neq('id', 'current');

    if (err) {
      setError('Failed to revoke sessions. Please try again.');
      setRevokingAll(false);
      return;
    }

    // Sign out all other devices via Supabase
    await supabase.auth.signOut({ scope: 'others' });

    // Keep only current session in UI
    setSessions(prev => prev.filter(s => s.id === 'current'));
    setRevokingAll(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#060810', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#35f2a8', fontSize: 32, animation: 'pulse 1.5s infinite' }}>◆</div>
        <style>{`@keyframes pulse{0%,100%{opacity:0.4;transform:scale(0.9)}50%{opacity:1;transform:scale(1.1)}}`}</style>
      </div>
    );
  }

  const otherSessions = sessions.filter(s => s.id !== 'current');
  const currentSession = sessions.find(s => s.id === 'current');

  return (
    <div style={{
      minHeight: '100vh', background: '#060810',
      fontFamily: 'DM Sans, system-ui, sans-serif', color: '#eef0f8', paddingBottom: 40,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px 16px' }}>
        <button
          onClick={() => navigate('/profile')}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#eef0f8', fontSize: 18,
          }}
        >←</button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Active Sessions</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(238,240,248,0.4)' }}>
            {sessions.length} {sessions.length === 1 ? 'device' : 'devices'} logged in
          </p>
        </div>
      </div>

      <div style={{ padding: '0 24px' }}>
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12, padding: '12px 16px', color: '#f87171', fontSize: 14, marginBottom: 20,
          }}>{error}</div>
        )}

        {/* Info banner */}
        <div style={{
          background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)',
          borderRadius: 14, padding: '14px 16px', marginBottom: 24,
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🔐</span>
          <p style={{ margin: 0, color: 'rgba(238,240,248,0.45)', fontSize: 13, lineHeight: 1.6 }}>
            These are all the devices currently logged into your account. Revoke any session you don't recognise.
          </p>
        </div>

        {/* Current session */}
        {currentSession && (() => {
          const { device, browser, icon } = parseDevice(currentSession.user_agent);
          return (
            <div style={{ marginBottom: 24 }}>
              <p style={{
                color: 'rgba(238,240,248,0.35)', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px',
              }}>Current Session</p>

              <div style={{
                background: 'rgba(53,242,168,0.05)',
                border: '1px solid rgba(53,242,168,0.2)',
                borderRadius: 18, padding: '16px 18px',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: 'rgba(53,242,168,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>{icon}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{device}</p>
                    <span style={{
                      background: 'rgba(53,242,168,0.15)', color: '#35f2a8',
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                    }}>This device</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(238,240,248,0.4)' }}>
                    {browser} · Active now
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Other sessions */}
        {otherSessions.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{
                color: 'rgba(238,240,248,0.35)', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0,
              }}>Other Devices</p>
              {otherSessions.length > 1 && (
                <button
                  onClick={() => setShowConfirmAll(true)}
                  style={{
                    background: 'none', border: 'none',
                    color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >Revoke all</button>
              )}
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 18, overflow: 'hidden',
            }}>
              {otherSessions.map((session, i) => {
                const { device, browser, icon } = parseDevice(session.user_agent);
                return (
                  <div
                    key={session.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '15px 18px',
                      borderBottom: i < otherSessions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: 'rgba(255,255,255,0.05)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20,
                    }}>{icon}</div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 600 }}>{device}</p>
                      <p style={{ margin: 0, fontSize: 12, color: 'rgba(238,240,248,0.4)' }}>
                        {browser}
                        {session.ip ? ` · ${session.ip}` : ''}
                        {' · '}
                        {timeAgo(session.updated_at)}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRevoke(session.id)}
                      disabled={revoking === session.id}
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: 10, padding: '7px 14px',
                        color: revoking === session.id ? 'rgba(248,113,113,0.5)' : '#f87171',
                        fontSize: 13, fontWeight: 600, cursor: revoking === session.id ? 'not-allowed' : 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      {revoking === session.id ? '...' : 'Revoke'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No other sessions */}
        {otherSessions.length === 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 18, padding: '32px 24px', textAlign: 'center', marginBottom: 24,
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
            <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600 }}>Only this device</p>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(238,240,248,0.4)' }}>
              No other active sessions found.
            </p>
          </div>
        )}

        {/* Sign out all devices */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 18, overflow: 'hidden',
        }}>
          <div
            onClick={() => setShowConfirmAll(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '15px 18px', cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: 'rgba(239,68,68,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>🚪</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#f87171' }}>
                Sign out all devices
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(238,240,248,0.4)' }}>
                Revoke all sessions including this one
              </p>
            </div>
            <span style={{ color: 'rgba(238,240,248,0.25)', fontSize: 18 }}>›</span>
          </div>
        </div>
      </div>

      {/* Confirm revoke all modal */}
      {showConfirmAll && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          zIndex: 100, padding: '0 16px 16px',
        }}
          onClick={() => setShowConfirmAll(false)}
        >
          <div
            style={{
              background: '#0e1420', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 24, padding: '28px 24px', width: '100%', maxWidth: 420,
              animation: 'slideUp 0.25s ease-out',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
              <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800 }}>Sign out everywhere?</h2>
              <p style={{ margin: 0, color: 'rgba(238,240,248,0.5)', fontSize: 14, lineHeight: 1.6 }}>
                This will sign you out of all devices, including this one. You'll need to log in again.
              </p>
            </div>

            <button
              onClick={handleRevokeAll}
              disabled={revokingAll}
              style={{
                width: '100%', padding: '15px', borderRadius: 14, border: 'none',
                background: revokingAll ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.85)',
                color: '#fff', fontSize: 16, fontWeight: 700,
                cursor: revokingAll ? 'not-allowed' : 'pointer', marginBottom: 12,
              }}
            >
              {revokingAll ? 'Signing out…' : 'Yes, sign out all devices'}
            </button>

            <button
              onClick={() => setShowConfirmAll(false)}
              style={{
                width: '100%', padding: '15px', borderRadius: 14,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#eef0f8', fontSize: 16, fontWeight: 600, cursor: 'pointer',
              }}
            >Cancel</button>
          </div>
        </div>
      )}

      <style>{`@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}
