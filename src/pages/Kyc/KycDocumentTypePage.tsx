import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DOC_TYPES = [
  {
    id: 'passport',
    icon: '🛂',
    title: 'Passport',
    desc: 'Upload the photo page of your passport',
    sides: 1,
  },
  {
    id: 'drivers_licence',
    icon: '🚗',
    title: "Driver's Licence",
    desc: 'Upload both front and back of your licence',
    sides: 2,
  },
  {
    id: 'national_id',
    icon: '🪪',
    title: 'National ID Card',
    desc: 'Upload both front and back of your ID card',
    sides: 2,
  },
];

export default function KycDocumentTypePage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('');

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 30% 20%, rgba(53,242,168,0.06), transparent 50%), #060810',
      fontFamily: 'DM Sans, system-ui, sans-serif', color: '#eef0f8',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px 16px' }}>
        <button onClick={() => navigate('/kyc')} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, width: 40, height: 40, display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', color: '#eef0f8', fontSize: 18,
        }}>←</button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Choose Document</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(238,240,248,0.4)' }}>Step 1 of 3</p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '0 24px', marginBottom: 28 }}>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 999 }}>
          <div style={{ height: '100%', width: '33%', borderRadius: 999, background: 'linear-gradient(90deg, #35f2a8, #18c87a)' }} />
        </div>
      </div>

      <div style={{ padding: '0 24px 32px' }}>
        <p style={{ color: 'rgba(238,240,248,0.6)', fontSize: 15, margin: '0 0 24px', lineHeight: 1.6 }}>
          Choose the document you'd like to use to verify your identity.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          {DOC_TYPES.map(doc => (
            <div
              key={doc.id}
              onClick={() => setSelected(doc.id)}
              style={{
                background: selected === doc.id ? 'rgba(53,242,168,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${selected === doc.id ? 'rgba(53,242,168,0.35)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 18, padding: '18px 16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14,
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: selected === doc.id ? 'rgba(53,242,168,0.15)' : 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
              }}>{doc.icon}</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: selected === doc.id ? '#35f2a8' : '#eef0f8' }}>
                  {doc.title}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 13, color: 'rgba(238,240,248,0.45)' }}>{doc.desc}</p>
              </div>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${selected === doc.id ? '#35f2a8' : 'rgba(255,255,255,0.2)'}`,
                background: selected === doc.id ? '#35f2a8' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {selected === doc.id && <span style={{ color: '#050c18', fontSize: 12, fontWeight: 800 }}>✓</span>}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => selected && navigate('/kyc/upload', { state: { docType: selected, sides: DOC_TYPES.find(d => d.id === selected)?.sides } })}
          disabled={!selected}
          style={{
            width: '100%', padding: '16px', borderRadius: 14, border: 'none',
            background: selected ? 'linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)' : 'rgba(255,255,255,0.08)',
            color: selected ? '#050c18' : 'rgba(238,240,248,0.3)',
            fontSize: 16, fontWeight: 700,
            cursor: selected ? 'pointer' : 'not-allowed',
            boxShadow: selected ? '0 0 24px rgba(53,242,168,0.3)' : 'none',
            transition: 'all 0.2s',
          }}
        >Continue →</button>
      </div>
    </div>
  );
}