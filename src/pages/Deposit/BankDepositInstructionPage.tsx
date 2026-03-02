import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

type CopyState = Record<string, boolean>;

// In a real app these would come from your backend / Supabase config
const BANK_DETAILS = {
  bankName: 'Commonwealth Bank',
  accountName: 'ShadowMint Pty Ltd',
  bsb: '062-000',
  accountNumber: '1234 5678',
  swift: 'CTBAAU2S',
};

export default function BankDepositInstructionsPage() {
  const navigate = useNavigate();
  const [userReference, setUserReference] = useState('');
  const [copied, setCopied] = useState<CopyState>({});
  const [balance, setBalance] = useState<number | null>(null);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n / 100);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login', { replace: true }); return; }

      // Generate unique reference from user ID (last 8 chars)
      const ref = 'SM-' + session.user.id.replace(/-/g, '').toUpperCase().slice(-8);
      setUserReference(ref);

      const { data: wallet } = await supabase
        .from('wallets').select('balance').eq('user_id', session.user.id).single();
      setBalance(wallet?.balance ?? 0);
    };
    load();
  }, [navigate]);

  const copyToClipboard = (key: string, value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(prev => ({ ...prev, [key]: true }));
      setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2000);
    });
  };

  const fields = [
    { key: 'bank',    label: 'Bank',           value: BANK_DETAILS.bankName },
    { key: 'name',    label: 'Account Name',   value: BANK_DETAILS.accountName },
    { key: 'bsb',     label: 'BSB',            value: BANK_DETAILS.bsb },
    { key: 'account', label: 'Account Number', value: BANK_DETAILS.accountNumber },
    { key: 'ref',     label: 'Reference (Required)', value: userReference, highlight: true },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 30% 20%, rgba(53,242,168,0.07), transparent 50%), #060810',
      fontFamily: 'DM Sans, system-ui, sans-serif',
      color: '#eef0f8',
      paddingBottom: 32,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '20px 24px 16px',
      }}>
        <button
          onClick={() => navigate('/wallet')}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#eef0f8', fontSize: 18,
          }}
        >←</button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Bank Deposit</h1>
          {balance !== null && (
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(238,240,248,0.4)' }}>
              Current balance: {fmt(balance)}
            </p>
          )}
        </div>
      </div>

      <div style={{ padding: '4px 24px' }}>

        {/* Hero instruction card */}
        <div style={{
          background: 'linear-gradient(135deg, #065f46 0%, #0d7a5f 40%, #10b981 100%)',
          borderRadius: 24, padding: '24px',
          marginBottom: 24, position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(16,185,129,0.2)',
        }}>
          <div style={{
            position: 'absolute', top: -20, right: -20,
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
          }} />
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏦</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#fff' }}>
            Transfer from your bank
          </h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.6 }}>
            Use the details below to make a bank transfer. Funds typically arrive within <strong style={{ color: '#fff' }}>1–2 business days</strong>.
          </p>
        </div>

        {/* ⚠️ Reference warning */}
        <div style={{
          background: 'rgba(246,166,35,0.1)',
          border: '1px solid rgba(246,166,35,0.3)',
          borderRadius: 14, padding: '14px 16px',
          display: 'flex', gap: 12, alignItems: 'flex-start',
          marginBottom: 20,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
          <p style={{ margin: 0, color: '#f6a623', fontSize: 13, lineHeight: 1.5 }}>
            You <strong>must include your reference number</strong> exactly as shown below, or your deposit cannot be matched to your account.
          </p>
        </div>

        {/* Bank detail fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {fields.map(field => (
            <div
              key={field.key}
              style={{
                background: field.highlight
                  ? 'rgba(53,242,168,0.08)'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${field.highlight ? 'rgba(53,242,168,0.3)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 16, padding: '14px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                gap: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: '0 0 4px',
                  fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: field.highlight ? '#35f2a8' : 'rgba(238,240,248,0.4)',
                }}>
                  {field.label}
                </p>
                <p style={{
                  margin: 0, fontSize: 16, fontWeight: 700,
                  color: field.highlight ? '#35f2a8' : '#eef0f8',
                  fontFamily: field.key === 'ref' || field.key === 'bsb' || field.key === 'account'
                    ? 'DM Mono, monospace' : 'inherit',
                  letterSpacing: field.key === 'ref' ? '0.05em' : 'inherit',
                }}>
                  {field.value || '…'}
                </p>
              </div>

              <button
                onClick={() => copyToClipboard(field.key, field.value)}
                style={{
                  padding: '8px 14px', borderRadius: 10, border: 'none',
                  background: copied[field.key]
                    ? 'rgba(53,242,168,0.2)'
                    : 'rgba(255,255,255,0.08)',
                  color: copied[field.key] ? '#35f2a8' : 'rgba(238,240,248,0.6)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s', flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {copied[field.key] ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          ))}
        </div>

        {/* Copy all button */}
        <button
          onClick={() => {
            const all = `Bank: ${BANK_DETAILS.bankName}\nAccount Name: ${BANK_DETAILS.accountName}\nBSB: ${BANK_DETAILS.bsb}\nAccount Number: ${BANK_DETAILS.accountNumber}\nReference: ${userReference}`;
            copyToClipboard('all', all);
          }}
          style={{
            width: '100%', padding: '14px',
            background: copied['all'] ? 'rgba(53,242,168,0.15)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${copied['all'] ? 'rgba(53,242,168,0.3)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 14,
            color: copied['all'] ? '#35f2a8' : 'rgba(238,240,248,0.7)',
            fontSize: 15, fontWeight: 600, cursor: 'pointer',
            marginBottom: 12, transition: 'all 0.2s',
          }}
        >
          {copied['all'] ? '✓ All details copied!' : '📋 Copy All Details'}
        </button>

        <button
          onClick={() => navigate('/wallet')}
          style={{
            width: '100%', padding: '14px',
            background: 'linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)',
            border: 'none', borderRadius: 14,
            color: '#050c18', fontSize: 15, fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 0 24px rgba(53,242,168,0.25)',
          }}
        >
          Done — Back to Wallet
        </button>

        {/* Footer note */}
        <p style={{
          textAlign: 'center', color: 'rgba(238,240,248,0.3)',
          fontSize: 12, marginTop: 20, lineHeight: 1.6,
        }}>
          Minimum deposit: $10 · Maximum: $10,000 per transfer<br />
          Processing time: 1–2 business days
        </p>
      </div>
    </div>
  );
}