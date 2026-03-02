import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

type SavedAccount = {
  id: string;
  account_name: string;
  bsb: string;
  account_number: string;
  bank_name: string;
  is_default: boolean;
};

export default function WithdrawPage() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<SavedAccount | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newAccount, setNewAccount] = useState({ accountName: '', bsb: '', accountNumber: '', bankName: '' });
  const [saveAccount, setSaveAccount] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n / 100);

  const quickAmounts = [50, 100, 200, 500];

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login', { replace: true }); return; }

      const { data: wallet } = await supabase
        .from('wallets').select('balance').eq('user_id', session.user.id).single();
      setBalance(wallet?.balance ?? 0);

      const { data: accounts } = await supabase
        .from('bank_accounts').select('*').eq('user_id', session.user.id).order('is_default', { ascending: false });

      setSavedAccounts(accounts ?? []);
      if (accounts?.length) {
        setSelectedAccount(accounts.find(a => a.is_default) ?? accounts[0]);
      } else {
        setShowNewForm(true);
      }
      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleContinue = () => {
    setError('');
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) { setError('Please enter a valid amount.'); return; }
    if (amt < 10) { setError('Minimum withdrawal is $10.00.'); return; }
    if (amt * 100 > balance) { setError(`Insufficient balance. You have ${fmt(balance)} available.`); return; }

    const account = showNewForm ? {
      id: 'new',
      account_name: newAccount.accountName,
      bsb: newAccount.bsb,
      account_number: newAccount.accountNumber,
      bank_name: newAccount.bankName,
      is_default: false,
    } : selectedAccount;

    if (!account?.account_name) { setError('Please enter account name.'); return; }
    if (!account?.bsb || account.bsb.replace(/\D/g, '').length !== 6) { setError('Please enter a valid 6-digit BSB.'); return; }
    if (!account?.account_number || account.account_number.replace(/\D/g, '').length < 6) { setError('Please enter a valid account number.'); return; }

    navigate('/withdraw/confirm', { state: { amount: amt, account, saveAccount } });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#060810', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#35f2a8', fontSize: 32, animation: 'pulse 1.5s infinite' }}>✦</div>
        <style>{`@keyframes pulse{0%,100%{opacity:0.4;transform:scale(0.9)}50%{opacity:1;transform:scale(1.1)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 25% 15%, rgba(53,242,168,0.06), transparent 50%), #060810',
      fontFamily: 'DM Sans, system-ui, sans-serif', color: '#eef0f8', paddingBottom: 32,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px 16px' }}>
        <button onClick={() => navigate('/wallet')} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, width: 40, height: 40, display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', color: '#eef0f8', fontSize: 18,
        }}>←</button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Withdraw</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(238,240,248,0.4)' }}>
            Available: {fmt(balance)}
          </p>
        </div>
      </div>

      <div style={{ padding: '4px 24px' }}>
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12, padding: '12px 16px', color: '#f87171', fontSize: 14, marginBottom: 20,
          }}>{error}</div>
        )}

        {/* Amount */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ color: 'rgba(238,240,248,0.5)', fontSize: 12, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10 }}>
            Amount (AUD)
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
              fontSize: 20, fontWeight: 700, color: '#35f2a8' }}>$</span>
            <input
              type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0.00" min="10" step="0.01"
              style={{
                width: '100%', padding: '16px 16px 16px 36px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 14, color: '#eef0f8', fontSize: 28, fontWeight: 700,
                outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(53,242,168,0.45)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {quickAmounts.map(q => (
              <button key={q} onClick={() => setAmount(String(q))} style={{
                padding: '7px 14px', borderRadius: 999,
                background: amount === String(q) ? 'rgba(53,242,168,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${amount === String(q) ? 'rgba(53,242,168,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: amount === String(q) ? '#35f2a8' : 'rgba(238,240,248,0.6)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>${q}</button>
            ))}
            <button onClick={() => setAmount(String(balance / 100))} style={{
              padding: '7px 14px', borderRadius: 999,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(238,240,248,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>Max</button>
          </div>
        </div>

        {/* Saved accounts */}
        {savedAccounts.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: 'rgba(238,240,248,0.5)', fontSize: 12, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10 }}>
              Withdraw To
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {savedAccounts.map(acc => (
                <div key={acc.id} onClick={() => { setSelectedAccount(acc); setShowNewForm(false); }} style={{
                  background: selectedAccount?.id === acc.id && !showNewForm
                    ? 'rgba(53,242,168,0.08)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${selectedAccount?.id === acc.id && !showNewForm ? 'rgba(53,242,168,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#eef0f8' }}>{acc.account_name}</p>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(238,240,248,0.45)',
                      fontFamily: 'DM Mono, monospace' }}>
                      BSB {acc.bsb} · {acc.account_number}
                    </p>
                  </div>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    border: `2px solid ${selectedAccount?.id === acc.id && !showNewForm ? '#35f2a8' : 'rgba(255,255,255,0.2)'}`,
                    background: selectedAccount?.id === acc.id && !showNewForm ? '#35f2a8' : 'transparent',
                    flexShrink: 0,
                  }} />
                </div>
              ))}

              <button onClick={() => { setShowNewForm(true); setSelectedAccount(null); }} style={{
                background: showNewForm ? 'rgba(53,242,168,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px dashed ${showNewForm ? 'rgba(53,242,168,0.3)' : 'rgba(255,255,255,0.15)'}`,
                borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
                color: showNewForm ? '#35f2a8' : 'rgba(238,240,248,0.5)',
                fontSize: 14, fontWeight: 600, textAlign: 'left',
              }}>+ Use a different account</button>
            </div>
          </div>
        )}

        {/* New account form */}
        {showNewForm && (
          <div style={{ marginBottom: 24 }}>
            {!savedAccounts.length && (
              <label style={{ color: 'rgba(238,240,248,0.5)', fontSize: 12, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10 }}>
                Bank Account
              </label>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { key: 'accountName', label: 'Account Name', placeholder: 'e.g. John Smith', type: 'text' },
                { key: 'bankName', label: 'Bank Name', placeholder: 'e.g. Commonwealth Bank', type: 'text' },
                { key: 'bsb', label: 'BSB', placeholder: '062-000', type: 'text' },
                { key: 'accountNumber', label: 'Account Number', placeholder: '1234 5678', type: 'text' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ color: 'rgba(238,240,248,0.45)', fontSize: 12,
                    display: 'block', marginBottom: 6 }}>{field.label}</label>
                  <input
                    type={field.type}
                    value={(newAccount as any)[field.key]}
                    onChange={e => setNewAccount(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    style={{
                      width: '100%', padding: '12px 14px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12, color: '#eef0f8', fontSize: 15,
                      outline: 'none', boxSizing: 'border-box',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(53,242,168,0.45)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                </div>
              ))}

              {/* Save toggle */}
              <div onClick={() => setSaveAccount(p => !p)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, cursor: 'pointer', marginTop: 4,
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6,
                  background: saveAccount ? '#35f2a8' : 'rgba(255,255,255,0.1)',
                  border: `2px solid ${saveAccount ? '#35f2a8' : 'rgba(255,255,255,0.2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {saveAccount && <span style={{ color: '#050c18', fontSize: 12, fontWeight: 800 }}>✓</span>}
                </div>
                <span style={{ color: 'rgba(238,240,248,0.7)', fontSize: 14 }}>Save this account for future withdrawals</span>
              </div>
            </div>
          </div>
        )}

        <button onClick={handleContinue} style={{
          width: '100%', padding: '16px',
          background: 'linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)',
          border: 'none', borderRadius: 14,
          color: '#050c18', fontSize: 16, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 0 24px rgba(53,242,168,0.3)',
        }}>
          Review Withdrawal →
        </button>
      </div>
    </div>
  );
}