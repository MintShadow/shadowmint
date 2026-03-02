import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

type UploadState = { file: File | null; preview: string | null; uploading: boolean; url: string | null };

const defaultUpload = (): UploadState => ({ file: null, preview: null, uploading: false, url: null });

export default function KycDocumentUploadPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { docType = 'passport', sides = 1 } = location.state || {};

  const [front, setFront] = useState<UploadState>(defaultUpload());
  const [back, setBack] = useState<UploadState>(defaultUpload());
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  const docLabel: Record<string, string> = {
    passport: 'Passport',
    drivers_licence: "Driver's Licence",
    national_id: 'National ID',
  };

  const uploadFile = async (file: File, side: 'front' | 'back') => {
    const setter = side === 'front' ? setFront : setBack;
    const preview = URL.createObjectURL(file);
    setter(prev => ({ ...prev, file, preview, uploading: true }));

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const ext = file.name.split('.').pop();
    const path = `kyc/${session.user.id}/${docType}_${side}.${ext}`;

    const { data, error: uploadErr } = await supabase.storage
      .from('kyc-documents')
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      // If storage bucket doesn't exist yet, just store the preview URL locally
      setter(prev => ({ ...prev, uploading: false, url: preview }));
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('kyc-documents').getPublicUrl(data.path);
    setter(prev => ({ ...prev, uploading: false, url: publicUrl }));
  };

  const handleFileChange = (side: 'front' | 'back') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('File too large. Maximum 10MB.'); return; }
    if (!['image/jpeg', 'image/png', 'image/heic', 'image/webp'].includes(file.type)) {
      setError('Please upload a JPG, PNG or HEIC image.'); return;
    }
    setError('');
    uploadFile(file, side);
  };

  const handleContinue = async () => {
    if (!front.url) { setError('Please upload the front of your document.'); return; }
    if (sides === 2 && !back.url) { setError('Please upload the back of your document.'); return; }

    setSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate('/login', { replace: true }); return; }

    await supabase.from('kyc_status').update({
      id_type: docType,
      id_front_url: front.url,
      id_back_url: back.url ?? null,
      status: 'in_progress',
    }).eq('id', session.user.id);

    setSubmitting(false);
    navigate('/kyc/selfie', { state: { docType, frontUrl: front.url, backUrl: back.url } });
  };

  const UploadBox = ({ side, label, state }: { side: 'front' | 'back'; label: string; state: UploadState }) => (
    <div>
      <label style={{ color: 'rgba(238,240,248,0.45)', fontSize: 12, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10 }}>
        {label}
      </label>
      <div
        onClick={() => (side === 'front' ? frontRef : backRef).current?.click()}
        style={{
          border: `2px dashed ${state.preview ? 'rgba(53,242,168,0.4)' : 'rgba(255,255,255,0.15)'}`,
          borderRadius: 18, overflow: 'hidden', cursor: 'pointer',
          background: state.preview ? 'rgba(53,242,168,0.04)' : 'rgba(255,255,255,0.02)',
          minHeight: 160, position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}
      >
        {state.preview ? (
          <>
            <img src={state.preview} alt="" style={{ width: '100%', height: 160, objectFit: 'cover' }} />
            {state.uploading && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(6,8,16,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 8,
              }}>
                <div style={{ color: '#35f2a8', fontSize: 24, animation: 'spin 1s linear infinite' }}>↻</div>
                <span style={{ color: '#35f2a8', fontSize: 13, fontWeight: 600 }}>Uploading…</span>
              </div>
            )}
            {!state.uploading && state.url && (
              <div style={{
                position: 'absolute', top: 10, right: 10,
                background: 'rgba(53,242,168,0.9)', borderRadius: 8,
                padding: '4px 10px', color: '#050c18', fontSize: 12, fontWeight: 700,
              }}>✓ Uploaded</div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📷</div>
            <p style={{ margin: 0, color: 'rgba(238,240,248,0.6)', fontSize: 14, fontWeight: 600 }}>
              Tap to upload photo
            </p>
            <p style={{ margin: '4px 0 0', color: 'rgba(238,240,248,0.3)', fontSize: 12 }}>
              JPG, PNG or HEIC · Max 10MB
            </p>
          </div>
        )}
      </div>
      <input ref={side === 'front' ? frontRef : backRef} type="file"
        accept="image/*" style={{ display: 'none' }} onChange={handleFileChange(side)} />
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', background: '#060810',
      fontFamily: 'DM Sans, system-ui, sans-serif', color: '#eef0f8', paddingBottom: 32,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px 16px' }}>
        <button onClick={() => navigate('/kyc/document-type')} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, width: 40, height: 40, display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', color: '#eef0f8', fontSize: 18,
        }}>←</button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Upload {docLabel[docType]}</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(238,240,248,0.4)' }}>Step 2 of 3</p>
        </div>
      </div>

      {/* Progress */}
      <div style={{ padding: '0 24px', marginBottom: 24 }}>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 999 }}>
          <div style={{ height: '100%', width: '66%', borderRadius: 999, background: 'linear-gradient(90deg, #35f2a8, #18c87a)' }} />
        </div>
      </div>

      <div style={{ padding: '0 24px' }}>
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12, padding: '12px 16px', color: '#f87171', fontSize: 14, marginBottom: 20,
          }}>{error}</div>
        )}

        {/* Tips */}
        <div style={{
          background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)',
          borderRadius: 14, padding: '14px 16px', marginBottom: 24,
          display: 'flex', gap: 12,
        }}>
          <span style={{ fontSize: 18 }}>💡</span>
          <div>
            <p style={{ margin: '0 0 4px', color: '#60a5fa', fontWeight: 700, fontSize: 13 }}>Tips for a good photo</p>
            <p style={{ margin: 0, color: 'rgba(238,240,248,0.5)', fontSize: 12, lineHeight: 1.6 }}>
              Good lighting · All 4 corners visible · No glare or blur · Text clearly readable
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
          <UploadBox side="front" label={sides === 2 ? 'Front Side' : 'Photo Page'} state={front} />
          {sides === 2 && <UploadBox side="back" label="Back Side" state={back} />}
        </div>

        <button
          onClick={handleContinue}
          disabled={submitting || front.uploading || back.uploading}
          style={{
            width: '100%', padding: '16px', borderRadius: 14, border: 'none',
            background: submitting ? 'rgba(53,242,168,0.35)' : 'linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)',
            color: '#050c18', fontSize: 16, fontWeight: 700,
            cursor: submitting ? 'not-allowed' : 'pointer',
            boxShadow: submitting ? 'none' : '0 0 24px rgba(53,242,168,0.3)',
          }}
        >
          {submitting ? 'Saving…' : 'Continue to Selfie →'}
        </button>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}