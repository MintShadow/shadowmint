import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

type Profile = {
  full_name: string | null;
  username: string | null;
  phone: string | null;
  avatar_url: string | null;
  city: string | null;
  country: string | null;
};

// Simple visual QR
function MiniQR({ value, size = 120 }: { value: string; size?: number }) {
  const GRID = 21;
  const seed = [...value].reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  const abs = Math.abs(seed);
  const finder = new Set<string>();
  const addFinder = (sr: number, sc: number) => {
    for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
      if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4))
        finder.add(`${sr + r},${sc + c}`);
    }
  };
  addFinder(0, 0); addFinder(0, GRID - 7); addFinder(GRID - 7, 0);
  const cells = [];
  for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) {
    const key = `${r},${c}`;
    cells.push({ r, c, dark: finder.has(key) || ((abs ^ (r * 37 + c * 19 + r * c * 3)) % 3 !== 0) });
  }
  const cell = (size - 16) / GRID;
  return (
    <div style={{ background: '#fff', padding: 8, borderRadius: 10, display: 'inline-block' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID}, ${cell}px)` }}>
        {cells.map(({ r, c, dark }) => (
          <div key={`${r}-${c}`} style={{ width: cell, height: cell, background: dark ? '#060810' : '#fff' }} />
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [email, setEmail] = useState('');
  const [balance, setBalance] = useState(0);
  const [kycStatus, setKycStatus] = useState('unverified');
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n / 100);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login', { replace: true }); return; }
      setEmail(session.user.email ?? '');

      const [profileRes, walletRes, kycRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('wallets').select('balance').eq('user_id', session.user.id).single(),
        supabase.from('kyc_status').select('status').eq('id', session.user.id).single(),
      ]);

      setProfile(profileRes.data ?? {});
      setBalance(walletRes.data?.balance ?? 0);
      setKycStatus(kycRes.data?.status ?? 'unverified');
      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  const username = profile.username || email.split('@')[0];
  const payLink = `${window.location.origin}/pay/${username}`;

  const copyLink = () => {
    navigator.clipboard?.writeText(payLink).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const kycBadge: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    unverified:  { label: 'Not verified', color: '#f87171', bg: 'rgba(239,68,68,0.12)', icon: '⚠' },
    in_progress: { label: 'In Progress',  color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', icon: '⏳' },
    pending:     { label: 'Under Review', color: '#f6a623', bg: 'rgba(246,166,35,0.12)', icon: '🔍' },
    verified:    { label: 'Verified',     color: '#35f2a8', bg: 'rgba(53,242,168,0.12)', icon: '✓' },
    failed:      { label: 'Failed',       color: '#f87171', bg: 'rgba(239,68,68,0.12)', icon: '✕' },
  };
  const kyc = kycBadge[kycStatus] ?? kycBadge.unverified;

  const initials = profile.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase();

  type MenuItem = { icon: string; label: string; sub: string; path: string; danger?: boolean; badge?: { label: string; color: string; bg: string } };
  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Account',
      items: [
        { icon: '👤', label: 'Edit Profile',    sub: 'Name, phone, location',     path: '/profile/edit' },
        { icon: '🏦', label: 'Bank Accounts',   sub: 'Saved bank details',        path: '/profile/bank-details' },
        {
          icon: '🪪', label: 'Identity Verification', sub: kyc.label, path: '/kyc',
          badge: kycStatus !== 'verified' ? { label: kyc.label, color: kyc.color, bg: kyc.bg } : undefined,
        },
      ],
    },
    {
      title: 'Security',
      items: [
        { icon: '🔒', label: 'Active Sessions',  sub: 'Manage logged-in devices', path: '/settings/sessions' },
      ],
    },
    {
      title: 'Danger Zone',
      items: [
        { icon: '🚪', label: 'Sign Out', sub: 'Log out of your account', path: '', danger: true },
      ],
    },
  ];

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
      minHeight: '100vh', background: '#060810',
      fontFamily: 'DM Sans, system-ui, sans-serif', color: '#eef0f8', paddingBottom: 100,
    }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 0' }}>
        <h1 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 800 }}>Profile</h1>
      </div>

      {/* Profile hero card */}
      <div style={{ padding: '0 24px', marginBottom: 16 }}>
        <div style={{
          background: 'linear-gradient(135deg, #065f46 0%, #0d7a5f 50%, #0a1628 100%)',
          borderRadius: 24, padding: '24px',
          boxShadow: '0 8px 40px rgba(16,185,129,0.15)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            {/* Avatar */}
            <div style={{
              width: 68, height: 68, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0d7a5f, #35f2a8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 800, color: '#050c18',
              flexShrink: 0, border: '3px solid rgba(255,255,255,0.15)',
              overflow: 'hidden',
            }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: '0 0 2px', fontSize: 19, fontWeight: 700, color: '#fff' }}>
                {profile.full_name || email.split('@')[0]}
              </h2>
              <p style={{ margin: '0 0 4px', fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                @{username}
              </p>
              {(profile.city || profile.country) && (
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                  📍 {[profile.city, profile.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>

            <button
              onClick={() => navigate('/profile/edit')}
              style={{
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 10, padding: '7px 14px',
                color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', flexShrink: 0,
              }}
            >Edit</button>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 14, padding: '12px 16px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.45)' }}>Balance</p>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#35f2a8' }}>{fmt(balance)}</p>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 14, padding: '12px 16px' }}>
              <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.45)' }}>KYC Status</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, background: kyc.bg, color: kyc.color, fontSize: 12, fontWeight: 700 }}>
                {kyc.icon} {kyc.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KYC nudge if unverified */}
      {(kycStatus === 'unverified' || kycStatus === 'failed') && (
        <div style={{ padding: '0 24px', marginBottom: 16 }}>
          <div
            onClick={() => navigate('/kyc')}
            style={{
              background: 'rgba(246,166,35,0.06)', border: '1px solid rgba(246,166,35,0.25)',
              borderRadius: 16, padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 28, flexShrink: 0 }}>🪪</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: '#f6a623' }}>
                {kycStatus === 'failed' ? 'Verification failed — try again' : 'Verify your identity'}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(238,240,248,0.4)' }}>
                Unlock higher limits and full features
              </p>
            </div>
            <span style={{ color: '#f6a623', fontSize: 20, flexShrink: 0 }}>›</span>
          </div>
        </div>
      )}

      {/* Payment link card */}
      <div style={{ padding: '0 24px', marginBottom: 16 }}>
        <p style={{ color: 'rgba(238,240,248,0.35)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>
          Your Payment Link
        </p>
        <div style={{
          background: 'rgba(53,242,168,0.04)', border: '1px solid rgba(53,242,168,0.15)',
          borderRadius: 20, overflow: 'hidden',
        }}>
          {/* Link row */}
          <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: 'rgba(53,242,168,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>🔗</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: '0 0 2px', fontSize: 12, color: 'rgba(238,240,248,0.4)', fontWeight: 600 }}>Share this link to receive money</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#35f2a8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'DM Mono, monospace' }}>
                /pay/{username}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid rgba(53,242,168,0.1)' }}>
            <button
              onClick={copyLink}
              style={{
                padding: '13px', background: linkCopied ? 'rgba(53,242,168,0.12)' : 'transparent',
                border: 'none', borderRight: '1px solid rgba(53,242,168,0.1)',
                color: linkCopied ? '#35f2a8' : 'rgba(238,240,248,0.6)',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {linkCopied ? '✓ Copied!' : '📋 Copy link'}
            </button>
            <button
              onClick={() => setShowQR(v => !v)}
              style={{
                padding: '13px', background: showQR ? 'rgba(53,242,168,0.12)' : 'transparent',
                border: 'none',
                color: showQR ? '#35f2a8' : 'rgba(238,240,248,0.6)',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {showQR ? '✕ Hide QR' : '📱 Show QR'}
            </button>
          </div>

          {/* QR code */}
          {showQR && (
            <div style={{ padding: '20px', textAlign: 'center', borderTop: '1px solid rgba(53,242,168,0.1)', animation: 'fadeIn 0.2s ease' }}>
              <MiniQR value={payLink} size={150} />
              <p style={{ margin: '12px 0 0', fontSize: 12, color: 'rgba(238,240,248,0.35)' }}>
                Anyone can scan this to send you money
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Menu sections */}
      <div style={{ padding: '0 24px' }}>
        {menuSections.map(section => (
          <div key={section.title} style={{ marginBottom: 20 }}>
            <p style={{ color: 'rgba(238,240,248,0.35)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>
              {section.title}
            </p>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden' }}>
              {section.items.map((item, i) => (
                <div
                  key={item.label}
                  onClick={() => item.danger ? handleSignOut() : navigate(item.path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '15px 18px',
                    borderBottom: i < section.items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: item.danger ? 'rgba(239,68,68,0.1)' : 'rgba(53,242,168,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  }}>{item.icon}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: item.danger ? '#f87171' : '#eef0f8' }}>
                      {item.label}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: item.badge ? item.badge.color : 'rgba(238,240,248,0.4)' }}>
                      {item.sub}
                    </p>
                  </div>

                  {!item.danger && (
                    <span style={{ color: 'rgba(238,240,248,0.2)', fontSize: 20, flexShrink: 0 }}>›</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* App version */}
      <p style={{ textAlign: 'center', color: 'rgba(238,240,248,0.15)', fontSize: 12, margin: '8px 0 0' }}>
        ShadowMint v3.0 · Built with ♥
      </p>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
