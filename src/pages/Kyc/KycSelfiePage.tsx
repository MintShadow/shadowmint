import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

export default function KycSelfiePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { docType, frontUrl, backUrl } = location.state || {};

  const [selfie, setSelfie] = useState<{ file: File | null; preview: string | null; uploading: boolean; url: string | null }>({
    file: null, preview: null, uploading: false, url: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('File too large. Maximum 10MB.'); return; }
    setError('');

    const preview = URL.createObjectURL(file);
    setSelfie({ file, preview, uploading: true, url: null });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const ext = file.name.split('.').pop();
    const path = `kyc/${session.user.id}/selfie.${ext}`;

    const { data, error: uploadErr } = await supabase.storage
      .from('kyc-documents').upload(path, file, { upsert: true });

    if (uploadErr) {
      setSelfie(prev => ({ ...prev, uploading: false, url: preview }));
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('kyc-documents').getPublicUrl(data.path);
    setSelfie(prev => ({ ...prev, uploading: false, url: publicUrl }));
  };

  const handleSubmit = async () => {
    if (!selfie.url) { setError('Please upload your selfie.'); return; }
    setSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate('/login', { replace: true }); return; }

    const { error: err } = await supabase.from('kyc_status').update({
      selfie_url: selfie.url,
      status: 'pending',
      submitted_at: new Date().toISOString(),
    }).eq('id', session.user.id);

    setSubmitting(false);
    if (err) { setError(err.message); return; }
    navigate('/kyc/pending', { replace: true });
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#060810',
      fontFamily: 'DM Sans, system-ui, sans-serif', color: '#eef0f8', paddingBottom: 32,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px 16px' }}>
        <button onClick={() => navigate('/kyc/upload', { state: { docType } })} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, width: 40, height: 40, display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', color: '#eef0f8', fontSize: 18,
        }}>←</button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Take a Selfie</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(238,240,248,0.4)' }}>Step 3 of 3</p>
        </div>
      </div>

      {/* Progress */}
      <div style={{ padding: '0 24px', marginBottom: 24 }}>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 999 }}>
          <div style={{ height: '100%', width: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #35f2a8, #18c87a)' }} />
        </div>
      </div>

      <div style={{ padding: '0 24px' }}>
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12, padding: '12px 16px', color: '#f87171', fontSize: 14, marginBottom: 20,
          }}>{error}</div>
        )}

        {/* Selfie guide */}
        <div style={{
          border: `2px dashed ${selfie.preview ? 'rgba(53,242,168,0.4)' : 'rgba(255,255,255,0.15)'}`,
          borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
          background: 'rgba(255,255,255,0.02)', minHeight: 240,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', marginBottom: 20,
        }} onClick={() => fileRef.current?.click()}>
          {selfie.preview ? (
            <>
              <img src={selfie.preview} alt="" style={{ width: '100%', height: 280, objectFit: 'cover' }} />
              {selfie.uploading && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(6,8,16,0.7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8,
                }}>
                  <div style={{ color: '#35f2a8', fontSize: 28, animation: 'spin 1s linear infinite' }}>↻</div>
                  <span style={{ color: '#35f2a8', fontSize: 13, fontWeight: 600 }}>Uploading…</span>
                </div>
              )}
              {!selfie.uploading && (
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  background: 'rgba(53,242,168,0.9)', borderRadius: 8,
                  padding: '4px 10px', color: '#050c18', fontSize: 12, fontWeight: 700,
                }}>✓ Ready</div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 24px' }}>
              {/* Face outline guide */}
              <div style={{
                width: 100, height: 120, borderRadius: '50% 50% 45% 45%',
                border: '2px dashed rgba(53,242,168,0.4)',
                margin: '0 auto 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 48,
              }}>🧑</div>
              <p style={{ margin: 0, color: 'rgba(238,240,248,0.6)', fontSize: 15, fontWeight: 600 }}>
                Tap to upload selfie
              </p>
              <p style={{ margin: '4px 0 0', color: 'rgba(238,240,248,0.3)', fontSize: 12 }}>
                Make sure your face is clearly visible
              </p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

        {/* Tips */}
        <div style={{
          background: 'rgba(53,242,168,0.05)', border: '1px solid rgba(53,242,168,0.15)',
          borderRadius: 14, padding: '14px 16px', marginBottom: 28,
        }}>
          <p style={{ margin: '0 0 8px', color: '#35f2a8', fontWeight: 700, fontSize: 13 }}>🤳 Selfie tips</p>
          {[
            'Face the camera directly',
            'Good lighting — no shadows',
            'Remove glasses and hats',
            'Neutral expression',
          ].map(tip => (
            <p key={tip} style={{ margin: '4px 0 0', color: 'rgba(238,240,248,0.5)', fontSize: 13 }}>
              · {tip}
            </p>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selfie.url || submitting}
          style={{
            width: '100%', padding: '16px', borderRadius: 14, border: 'none',
            background: !selfie.url || submitting
              ? 'rgba(255,255,255,0.08)'
              : 'linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)',
            color: !selfie.url || submitting ? 'rgba(238,240,248,0.3)' : '#050c18',
            fontSize: 16, fontWeight: 700,
            cursor: !selfie.url || submitting ? 'not-allowed' : 'pointer',
            boxShadow: selfie.url && !submitting ? '0 0 24px rgba(53,242,168,0.3)' : 'none',
          }}
        >
          {submitting ? 'Submitting…' : 'Submit for Review →'}
        </button>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}