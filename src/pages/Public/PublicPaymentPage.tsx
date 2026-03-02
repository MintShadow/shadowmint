import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n);

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

type Step = 'loading' | 'not_found' | 'enter' | 'review' | 'auth_required' | 'processing' | 'success' | 'error';

export default function PublicPaymentPage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('loading');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [paidAmount, setPaidAmount] = useState(0);

  const quickAmounts = [10, 20, 50, 100, 200, 500];

  // Load recipient profile + check session
  useEffect(() => {
    const init = async () => {
      if (!username) { setStep('not_found'); return; }

      // Fetch recipient profile by username
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .eq('username', username)
        .single();

      if (profileErr || !profileData) { setStep('not_found'); return; }
      setProfile(profileData);

      // Check if logged in
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user ?? null);

      setStep('enter');
    };
    init();
  }, [username]);

  const handleReview = () => {
    setError('');
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) { setError('Please enter a valid amount.'); return; }
    if (amt < 1) { setError('Minimum amount is $1.00.'); return; }
    if (amt > 10000) { setError('Maximum amount is $10,000.'); return; }

    if (!currentUser) {
      setStep('auth_required');
      return;
    }
    setStep('review');
  };

  const handlePay = async () => {
    if (!currentUser || !profile) return;
    setStep('processing');
    setError('');

    try {
      const amt = parseFloat(amount);
      const amountCents = Math.round(amt * 100);
      const senderId = currentUser.id;

      if (senderId === profile.id) throw new Error("You can't pay yourself.");

      // Check sender balance
      const { data: senderWallet, error: walletErr } = await supabase
        .from('wallets').select('id, balance').eq('user_id', senderId).single();
      if (walletErr || !senderWallet) throw new Error('Could not load your wallet.');
      if (senderWallet.balance < amountCents) throw new Error(
        `Insufficient balance. You have ${fmt(senderWallet.balance / 100)} available.`
      );

      // Debit sender
      const { error: debitErr } = await supabase
        .from('wallets')
        .update({ balance: senderWallet.balance - amountCents })
        .eq('id', senderWallet.id);
      if (debitErr) throw new Error('Failed to debit your wallet.');

      // Record sender transaction
      await supabase.from('transactions').insert({
        user_id: senderId,
        wallet_id: senderWallet.id,
        type: 'debit',
        category: 'transfer',
        amount: amountCents,
        description: note || `Paid to @${username}`,
        counterparty_id: profile.id,
        status: 'completed',
      });

      // Credit recipient
      const { data: recipientWallet } = await supabase
        .from('wallets').select('id, balance').eq('user_id', profile.id).single();
      if (recipientWallet) {
        await supabase.from('wallets')
          .update({ balance: recipientWallet.balance + amountCents })
          .eq('id', recipientWallet.id);

        await supabase.from('transactions').insert({
          user_id: profile.id,
          wallet_id: recipientWallet.id,
          type: 'credit',
          category: 'transfer',
          amount: amountCents,
          description: note || `Received from @${currentUser.user_metadata?.username || currentUser.email}`,
          counterparty_id: senderId,
          status: 'completed',
        });
      }

      setPaidAmount(amt);
      setStep('success');
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
      setStep('review');
    }
  };

  // ── Loading ──────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <div style={styles.page}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{ color: '#35f2a8', fontSize: 32, animation: 'spin 1s linear infinite' }}>↻</div>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────
  if (step === 'not_found') {
    return (
      <div style={{ ...styles.page, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 32px' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🔍</div>
        <h1 style={{ margin: '0 0 10px', fontSize: 24, fontWeight: 800 }}>User not found</h1>
        <p style={{ margin: '0 0 32px', color: 'rgba(238,240,248,0.45)', fontSize: 15 }}>
          @{username} doesn't exist on ShadowMint.
        </p>
        <button onClick={() => navigate('/')} style={styles.primaryBtn}>Go to ShadowMint</button>
      </div>
    );
  }

  // ── Auth required ────────────────────────────────────────
  if (step === 'auth_required') {
    return (
      <div style={{ ...styles.page, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 28px' }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>🔐</div>
        <h1 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 800 }}>Sign in to pay</h1>
        <p style={{ margin: '0 0 8px', color: 'rgba(238,240,248,0.5)', fontSize: 15 }}>
          You need a ShadowMint account to send{' '}
          <span style={{ color: '#35f2a8', fontWeight: 700 }}>{fmt(parseFloat(amount))}</span>{' '}
          to <span style={{ color: '#eef0f8', fontWeight: 600 }}>@{username}</span>.
        </p>
        <p style={{ margin: '0 0 32px', color: 'rgba(238,240,248,0.3)', fontSize: 13 }}>
          It's free and takes 30 seconds.
        </p>
        <button
          onClick={() => navigate('/login', { state: { redirect: `/pay/${username}`, amount, note } })}
          style={{ ...styles.primaryBtn, width: '100%', maxWidth: 320, marginBottom: 12 }}
        >Log in</button>
        <button
          onClick={() => navigate('/signup', { state: { redirect: `/pay/${username}`, amount, note } })}
          style={{ ...styles.secondaryBtn, width: '100%', maxWidth: 320, marginBottom: 20 }}
        >Create account</button>
        <button onClick={() => setStep('enter')} style={styles.ghostBtn}>← Back</button>
      </div>
    );
  }

  // ── Processing ───────────────────────────────────────────
  if (step === 'processing') {
    return (
      <div style={{ ...styles.page, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ color: '#35f2a8', fontSize: 48, animation: 'spin 1s linear infinite', marginBottom: 20 }}>↻</div>
        <p style={{ color: 'rgba(238,240,248,0.5)', fontSize: 15 }}>Processing payment…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div style={{ ...styles.page, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>
        <div style={{
          width: 96, height: 96, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(53,242,168,0.2), rgba(24,200,122,0.2))',
          border: '2px solid rgba(53,242,168,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 44, marginBottom: 28,
          animation: 'popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
          boxShadow: '0 0 40px rgba(53,242,168,0.2)',
        }}>✓</div>

        <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800 }}>Payment sent!</h1>
        <p style={{ margin: '0 0 4px', color: 'rgba(238,240,248,0.5)', fontSize: 15 }}>You paid</p>
        <p style={{ margin: '0 0 4px', fontSize: 36, fontWeight: 800, color: '#35f2a8' }}>{fmt(paidAmount)}</p>
        <p style={{ margin: '0 0 40px', color: 'rgba(238,240,248,0.4)', fontSize: 14 }}>to @{username}</p>

        <button onClick={() => navigate('/wallet')} style={{ ...styles.primaryBtn, width: '100%', maxWidth: 320, marginBottom: 12 }}>
          Go to Wallet
        </button>
        <button onClick={() => { setStep('enter'); setAmount(''); setNote(''); }} style={styles.ghostBtn}>
          Make another payment
        </button>
        <style>{`@keyframes popIn{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
      </div>
    );
  }

  // ── Avatar initials helper ───────────────────────────────
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : (username ?? '?')[0].toUpperCase();

  // ── Enter amount ─────────────────────────────────────────
  if (step === 'enter') {
    return (
      <div style={styles.page}>
        {/* ShadowMint branding */}
        <div style={{ textAlign: 'center', padding: '24px 24px 0' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#35f2a8', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            ✦ ShadowMint
          </span>
        </div>

        {/* Recipient card */}
        <div style={{ padding: '20px 24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #065f46, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, color: '#fff',
            marginBottom: 12, boxShadow: '0 0 24px rgba(53,242,168,0.25)',
          }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : initials}
          </div>
          <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>
            {profile?.full_name || `@${username}`}
          </h2>
          <p style={{ margin: 0, color: 'rgba(238,240,248,0.4)', fontSize: 13 }}>@{username}</p>
        </div>

        <div style={{ padding: '24px 24px 40px' }}>
          {error && (
            <div style={styles.errorBox}>{error}</div>
          )}

          {/* Amount */}
          <div style={{ marginBottom: 20 }}>
            <label style={styles.label}>Amount (AUD)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18, fontWeight: 700, color: '#35f2a8' }}>$</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                min="1"
                step="0.01"
                style={styles.amountInput}
                onFocus={e => (e.target.style.borderColor = 'rgba(53,242,168,0.45)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {quickAmounts.map(q => (
                <button key={q} onClick={() => setAmount(String(q))} style={{
                  padding: '7px 14px',
                  background: amount === String(q) ? 'rgba(53,242,168,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${amount === String(q) ? 'rgba(53,242,168,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 999, color: amount === String(q) ? '#35f2a8' : 'rgba(238,240,248,0.6)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                }}>${q}</button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div style={{ marginBottom: 32 }}>
            <label style={styles.label}>
              Note <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="What's it for?"
              maxLength={100}
              style={styles.textInput}
              onFocus={e => (e.target.style.borderColor = 'rgba(53,242,168,0.45)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          <button onClick={handleReview} style={styles.primaryBtn}>
            Continue →
          </button>

          {!currentUser && (
            <p style={{ textAlign: 'center', color: 'rgba(238,240,248,0.3)', fontSize: 12, marginTop: 16 }}>
              You'll need to log in to complete the payment
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Review ───────────────────────────────────────────────
  if (step === 'review') {
    const amt = parseFloat(amount);
    return (
      <div style={styles.page}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px 16px' }}>
          <button onClick={() => setStep('enter')} style={styles.backBtn}>←</button>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Review Payment</h1>
        </div>

        <div style={{ padding: '8px 24px 40px' }}>
          {error && <div style={styles.errorBox}>{error}</div>}

          {/* Hero card */}
          <div style={{
            background: 'linear-gradient(135deg, #065f46 0%, #0d7a5f 40%, #10b981 100%)',
            borderRadius: 24, padding: '32px 28px',
            textAlign: 'center', marginBottom: 24,
            boxShadow: '0 8px 40px rgba(16,185,129,0.25)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: '0 0 8px' }}>Paying</p>
            <h2 style={{ color: '#fff', fontSize: 42, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-1px' }}>{fmt(amt)}</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>AUD</p>
          </div>

          {/* Details */}
          <div style={styles.detailsCard}>
            {[
              { label: 'To', value: profile?.full_name ? `${profile.full_name} (@${username})` : `@${username}` },
              { label: 'Amount', value: fmt(amt) },
              { label: 'Fee', value: 'Free' },
              ...(note ? [{ label: 'Note', value: note }] : []),
            ].map((row, i, arr) => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 20px',
                borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <span style={{ color: 'rgba(238,240,248,0.5)', fontSize: 14 }}>{row.label}</span>
                <span style={{ color: row.label === 'Fee' ? '#35f2a8' : '#eef0f8', fontSize: 14, fontWeight: 600, maxWidth: '60%', textAlign: 'right', wordBreak: 'break-all' }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'rgba(53,242,168,0.06)', border: '1px solid rgba(53,242,168,0.15)', borderRadius: 16, marginBottom: 32 }}>
            <span style={{ color: '#eef0f8', fontSize: 16, fontWeight: 600 }}>Total</span>
            <span style={{ color: '#35f2a8', fontSize: 20, fontWeight: 800 }}>{fmt(amt)}</span>
          </div>

          <button onClick={handlePay} style={styles.primaryBtn}>Confirm & Pay</button>
          <p style={{ textAlign: 'center', color: 'rgba(238,240,248,0.3)', fontSize: 13, marginTop: 14 }}>This action cannot be undone</p>
        </div>
      </div>
    );
  }

  return null;
}

// ── Shared styles ──────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at 50% 10%, rgba(53,242,168,0.07), transparent 55%), #060810',
    fontFamily: 'DM Sans, system-ui, sans-serif',
    color: '#eef0f8',
  },
  primaryBtn: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)',
    border: 'none', borderRadius: 14,
    color: '#050c18', fontSize: 16, fontWeight: 700,
    cursor: 'pointer', boxShadow: '0 0 24px rgba(53,242,168,0.3)',
    transition: 'all 0.2s',
  },
  secondaryBtn: {
    width: '100%',
    padding: '16px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 14,
    color: '#eef0f8', fontSize: 16, fontWeight: 600,
    cursor: 'pointer',
  },
  ghostBtn: {
    background: 'none', border: 'none',
    color: 'rgba(238,240,248,0.4)', fontSize: 14, cursor: 'pointer',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, width: 40, height: 40,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: '#eef0f8', fontSize: 18,
  },
  label: {
    color: 'rgba(238,240,248,0.5)', fontSize: 12, fontWeight: 600,
    textTransform: 'uppercase' as const, letterSpacing: '0.08em',
    display: 'block', marginBottom: 10,
  },
  amountInput: {
    width: '100%', padding: '16px 16px 16px 32px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14, color: '#eef0f8',
    fontSize: 28, fontWeight: 700,
    outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.2s',
  },
  textInput: {
    width: '100%', padding: '13px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14, color: '#eef0f8', fontSize: 15,
    outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.2s',
  },
  errorBox: {
    background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 12, padding: '12px 16px',
    color: '#f87171', fontSize: 14, marginBottom: 20,
  },
  detailsCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20, overflow: 'hidden', marginBottom: 24,
  },
};
