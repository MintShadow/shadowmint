import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

type NavItem = {
  path: string;
  label: string;
  icon: (active: boolean) => JSX.Element;
  center?: boolean;
  badgeKey?: string;
};

const WalletIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="6" width="20" height="14" rx="3" stroke={active ? '#35f2a8' : 'currentColor'} strokeWidth="1.8"/>
    <path d="M2 10h20" stroke={active ? '#35f2a8' : 'currentColor'} strokeWidth="1.8"/>
    <circle cx="17" cy="15" r="1.5" fill={active ? '#35f2a8' : 'currentColor'}/>
    <path d="M6 4l4-2 4 2" stroke={active ? '#35f2a8' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const ActivityIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M3 12h3l2.5-7 4 14 2.5-7H21" stroke={active ? '#35f2a8' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SendIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <path d="M12 19V5M5 12l7-7 7 7" stroke="#050c18" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RequestIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12l7 7 7-7" stroke={active ? '#35f2a8' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="3.5" stroke={active ? '#35f2a8' : 'currentColor'} strokeWidth="1.8"/>
    <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke={active ? '#35f2a8' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  { path: '/wallet',   label: 'Wallet',   icon: (active) => <WalletIcon active={active} /> },
  { path: '/activity', label: 'Activity', icon: (active) => <ActivityIcon active={active} />, badgeKey: 'activity' },
  { path: '/send',     label: 'Send',     icon: () => <SendIcon />, center: true },
  { path: '/request',  label: 'Request',  icon: (active) => <RequestIcon active={active} /> },
  { path: '/profile',  label: 'Profile',  icon: (active) => <ProfileIcon active={active} /> },
];

const HIDDEN_ON = [
  '/login', '/signup', '/',
  '/send/review', '/send/success',
  '/withdraw/confirm', '/withdraw/success',
  '/kyc', '/kyc/document-type', '/kyc/upload',
  '/kyc/selfie', '/kyc/pending', '/kyc/success', '/kyc/failed',
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const [pendingCount, setPendingCount] = useState(0);

  // Poll for pending incoming requests
  useEffect(() => {
    const fetchPending = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from('payment_requests')
        .select('id')
        .eq('recipient_id', session.user.id)
        .eq('status', 'pending');

      setPendingCount(data?.length ?? 0);
    };

    fetchPending();

    // Refresh every 30 seconds
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [path]); // re-check when navigation happens

  if (HIDDEN_ON.some(p => path === p || path.startsWith('/pay/') || path.startsWith('/guest/'))) return null;

  return (
    <>
      <div style={{ height: 80 }} />
      <nav style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        height: 72,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        background: 'rgba(6,8,16,0.88)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderTop: '1px solid rgba(53,242,168,0.1)',
        zIndex: 100,
        padding: '0 8px',
      }}>
        {NAV_ITEMS.map((item) => {
          const isActive = path === item.path || path.startsWith(item.path + '/');
          const badge = item.badgeKey === 'activity' && pendingCount > 0 ? pendingCount : 0;

          if (item.center) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  width: 52, height: 52,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 0 24px rgba(53,242,168,0.45), 0 4px 16px rgba(0,0,0,0.4)',
                  transform: 'translateY(-8px)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseDown={e => (e.currentTarget.style.transform = 'translateY(-6px) scale(0.95)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'translateY(-8px) scale(1)')}
                onTouchStart={e => (e.currentTarget.style.transform = 'translateY(-6px) scale(0.95)')}
                onTouchEnd={e => (e.currentTarget.style.transform = 'translateY(-8px) scale(1)')}
              >
                <SendIcon />
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 0',
                color: isActive ? '#35f2a8' : 'rgba(238,240,248,0.35)',
                transition: 'color 0.15s ease',
                WebkitTapHighlightColor: 'transparent',
                position: 'relative',
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: 6,
                  width: 36, height: 36,
                  borderRadius: '50%',
                  background: 'rgba(53,242,168,0.1)',
                  filter: 'blur(8px)',
                }} />
              )}

              {/* Icon with badge */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                {item.icon(isActive)}
                {badge > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: -4, right: -6,
                    background: '#f6a623',
                    color: '#050c18',
                    fontSize: 9,
                    fontWeight: 800,
                    minWidth: 14, height: 14,
                    borderRadius: 999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px',
                    boxShadow: '0 0 8px rgba(246,166,35,0.6)',
                    animation: 'badgePop 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
                  }}>
                    {badge > 9 ? '9+' : badge}
                  </div>
                )}
              </div>

              <span style={{
                fontSize: 10,
                fontWeight: isActive ? 600 : 500,
                letterSpacing: '0.02em',
                fontFamily: 'DM Sans, system-ui, sans-serif',
              }}>
                {item.label}
              </span>

              {isActive && (
                <div style={{
                  position: 'absolute',
                  bottom: 4,
                  width: 4, height: 4,
                  borderRadius: '50%',
                  background: '#35f2a8',
                  boxShadow: '0 0 6px rgba(53,242,168,0.8)',
                }} />
              )}
            </button>
          );
        })}
      </nav>
      <style>{`@keyframes badgePop{from{transform:scale(0)}to{transform:scale(1)}}`}</style>
    </>
  );
}
