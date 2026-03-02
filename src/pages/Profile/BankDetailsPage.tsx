import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

type BankAccount = {
  id: string;
  account_name: string;
  bsb: string;
  account_number: string;
  bank_name: string;
  is_default: boolean;
};

export default function BankDetailsPage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ accountName: '', bankName: '', bsb: '', accountNumber: '' });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAccounts = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate('/login', { replace: true }); return; }
    const { data } = await supabase
      .from('bank_accounts').select('*').eq('user_id', session.user.id)
      .order('is_default', { ascending: false });
    setAccounts(data ?? []);
    setLoading(false);
  };

  useEffect(() => { loadAccounts(); }, []);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleAdd = async () => {
    setError('');
    if (!form.accountName.trim()) { setError('Account name is required.'); return; }
    if (!form.bsb.replace(/\D/g, '') || form.bsb.replace(/\D/g, '').length !== 6) { setError('Please enter a valid 6-digit BSB.'); return; }
    if (!form.accountNumber.replace(/\D/g, '') || form.accountNumber.replace(/\D/g, '').length < 6) { setError('Please enter a valid account number.'); return; }

    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error: err } = await supabase.from('bank_accounts').insert({
      user_id: session.user.id,
      account_name: form.accountName.trim(),
      bank_name: form.bankName.trim(),
      bsb: form.bsb.trim(),
      account_number: form.accountNumber.trim(),
      is_default: accounts.length === 0,
    });

    setSaving(false);
    if (err) { setError(err.message); return; }

    setForm({ accountName: '', bankName: '', bsb: '', accountNumber: '' });
    setShowForm(false);
    loadAccounts();
  };

  const handleSetDefault = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from('bank_accounts').update({ is_default: false }).eq('user_id', session.user.id);
    await supabase.from('bank_accounts').update({ is_default: true }).eq('id', id);
    loadAccounts();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await supabase.from('bank_accounts').delete().eq('id', id);
    setDeletingId(null);
    loadAccounts();
  };

  const inputStyle = {
    width: '100%', padding: '13px 16px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, color: '#eef0f8', fontSize: 15,
    outline: 'none', boxSizing: 'border-box' as const,
    fontFamily: 'DM Sans, system-ui, sans-serif',
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
      minHeight: '100vh', background: '#060810',
      fontFamily: 'DM Sans, system-ui, sans-serif', color: '#eef0f8', paddingBottom: 32,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px 16px' }}>
        <button onClick={() => navigate('/profile')} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, width: 40, height: 40, display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', color: '#eef0f8', fontSize: 18,
        }}>←</button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Bank Accounts</h1>
      </div>

      <div style={{ padding: '4px 24px' }}>
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12, padding: '12px 16px', color: '#f87171', fontSize: 14, marginBottom: 20,
          }}>{error}</div>
        )}

        {/* Saved accounts */}
        {accounts.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p style={{
              color: 'rgba(238,240,248,0.35)', fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px',
            }}>Saved Accounts</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {accounts.map(acc => (
                <div key={acc.id} style={{
                  background: acc.is_default ? 'rgba(53,242,168,0.06)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${acc.is_default ? 'rgba(53,242,168,0.25)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 16, padding: '16px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#eef0f8' }}>
                          {acc.account_name}
                        </p>
                        {acc.is_default && (
                          <span style={{
                            padding: '2px 8px', borderRadius: 999,
                            background: 'rgba(53,242,168,0.15)', color: '#35f2a8',
                            fontSize: 11, fontWeight: 700,
                          }}>Default</span>
                        )}
                      </div>
                      {acc.bank_name && (
                        <p style={{ margin: '0 0 2px', fontSize: 13, color: 'rgba(238,240,248,0.5)' }}>{acc.bank_name}</p>
                      )}
                      <p style={{
                        margin: 0, fontSize: 13, color: 'rgba(238,240,248,0.45)',
                        fontFamily: 'DM Mono, monospace',
                      }}>
                        BSB {acc.bsb} · {acc.account_number}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    {!acc.is_default && (
                      <button onClick={() => handleSetDefault(acc.id)} style={{
                        flex: 1, padding: '8px 12px', borderRadius: 10, border: 'none',
                        background: 'rgba(53,242,168,0.1)', color: '#35f2a8',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}>Set as Default</button>
                    )}
                    <button
                      onClick={() => handleDelete(acc.id)}
                      disabled={deletingId === acc.id}
                      style={{
                        flex: acc.is_default ? 1 : 0, padding: '8px 16px', borderRadius: 10, border: 'none',
                        background: 'rgba(239,68,68,0.1)', color: '#f87171',
                        fontSize: 12, fontWeight: 600,
                        cursor: deletingId === acc.id ? 'not-allowed' : 'pointer',
                        opacity: deletingId === acc.id ? 0.5 : 1,
                      }}
                    >
                      {deletingId === acc.id ? 'Removing…' : 'Remove'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {accounts.length === 0 && !showForm && (
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 20, padding: '40px 24px', textAlign: 'center', marginBottom: 24,
          }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🏦</div>
            <p style={{ color: 'rgba(238,240,248,0.5)', fontSize: 15, margin: '0 0 4px', fontWeight: 600 }}>
              No bank accounts yet
            </p>
            <p style={{ color: 'rgba(238,240,248,0.3)', fontSize: 13, margin: 0 }}>
              Add an account to enable withdrawals
            </p>
          </div>
        )}

        {/* Add account form */}
        {showForm && (
          <div style={{
            background: 'rgba(53,242,168,0.04)', border: '1px solid rgba(53,242,168,0.15)',
            borderRadius: 20, padding: '20px', marginBottom: 20,
          }}>
            <p style={{
              color: 'rgba(238,240,248,0.35)', fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px',
            }}>New Account</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { key: 'accountName', label: 'Account Name *', placeholder: 'e.g. John Smith' },
                { key: 'bankName',    label: 'Bank Name',       placeholder: 'e.g. Commonwealth Bank' },
                { key: 'bsb',         label: 'BSB *',           placeholder: '062-000' },
                { key: 'accountNumber', label: 'Account Number *', placeholder: '1234 5678' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ color: 'rgba(238,240,248,0.45)', fontSize: 12, display: 'block', marginBottom: 6 }}>
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={(form as any)[field.key]}
                    onChange={set(field.key)}
                    placeholder={field.placeholder}
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'rgba(53,242,168,0.45)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => { setShowForm(false); setError(''); setForm({ accountName: '', bankName: '', bsb: '', accountNumber: '' }); }} style={{
                flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)', color: 'rgba(238,240,248,0.6)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={handleAdd} disabled={saving} style={{
                flex: 2, padding: '12px', borderRadius: 12, border: 'none',
                background: saving ? 'rgba(53,242,168,0.35)' : 'linear-gradient(135deg, #35f2a8, #18c87a)',
                color: '#050c18', fontSize: 14, fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}>{saving ? 'Saving…' : 'Add Account'}</button>
            </div>
          </div>
        )}

        {!showForm && (
          <button onClick={() => setShowForm(true)} style={{
            width: '100%', padding: '14px', borderRadius: 14,
            background: 'linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)',
            border: 'none', color: '#050c18', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 0 24px rgba(53,242,168,0.25)',
          }}>+ Add Bank Account</button>
        )}
      </div>
    </div>
  );
}