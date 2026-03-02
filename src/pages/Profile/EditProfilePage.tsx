import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

type ProfileForm = {
  full_name: string;
  phone: string;
  date_of_birth: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
};

export default function EditProfilePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<ProfileForm>({
    full_name: '', phone: '', date_of_birth: '',
    address_line1: '', address_line2: '',
    city: '', state: '', postcode: '', country: 'AU',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login', { replace: true }); return; }

      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (data) {
        setForm({
          full_name: data.full_name ?? '',
          phone: data.phone ?? '',
          date_of_birth: data.date_of_birth ?? '',
          address_line1: data.address_line1 ?? '',
          address_line2: data.address_line2 ?? '',
          city: data.city ?? '',
          state: data.state ?? '',
          postcode: data.postcode ?? '',
          country: data.country ?? 'AU',
        });
      }
      setLoading(false);
    };
    load();
  }, [navigate]);

  const set = (key: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSave = async () => {
    setError('');
    if (!form.full_name.trim()) { setError('Full name is required.'); return; }

    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate('/login', { replace: true }); return; }

    const { error: err } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        date_of_birth: form.date_of_birth || null,
        address_line1: form.address_line1.trim(),
        address_line2: form.address_line2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postcode: form.postcode.trim(),
        country: form.country,
      })
      .eq('id', session.user.id);

    setSaving(false);
    if (err) { setError(err.message); return; }

    setSaved(true);
    setTimeout(() => { setSaved(false); navigate('/profile'); }, 1500);
  };

  const inputStyle = {
    width: '100%', padding: '13px 16px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, color: '#eef0f8', fontSize: 15,
    outline: 'none', boxSizing: 'border-box' as const,
    fontFamily: 'DM Sans, system-ui, sans-serif',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    color: 'rgba(238,240,248,0.45)', fontSize: 12,
    display: 'block' as const, marginBottom: 7,
  };

  const sections = [
    {
      title: 'Personal Info',
      fields: [
        { key: 'full_name',     label: 'Full Name *',     placeholder: 'John Smith',         type: 'text' },
        { key: 'phone',         label: 'Phone Number',    placeholder: '+61 4XX XXX XXX',    type: 'tel' },
        { key: 'date_of_birth', label: 'Date of Birth',   placeholder: '',                   type: 'date' },
      ],
    },
    {
      title: 'Address',
      fields: [
        { key: 'address_line1', label: 'Address Line 1',  placeholder: '123 Main Street',    type: 'text' },
        { key: 'address_line2', label: 'Address Line 2',  placeholder: 'Apt, Unit, Suite…',  type: 'text' },
        { key: 'city',          label: 'City / Suburb',   placeholder: 'Sydney',             type: 'text' },
        { key: 'state',         label: 'State',           placeholder: 'NSW',                type: 'text' },
        { key: 'postcode',      label: 'Postcode',        placeholder: '2000',               type: 'text' },
      ],
    },
  ];

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
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Edit Profile</h1>
      </div>

      <div style={{ padding: '4px 24px' }}>
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12, padding: '12px 16px', color: '#f87171', fontSize: 14, marginBottom: 20,
          }}>{error}</div>
        )}

        {sections.map(section => (
          <div key={section.title} style={{ marginBottom: 28 }}>
            <p style={{
              color: 'rgba(238,240,248,0.35)', fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px',
            }}>{section.title}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {section.fields.map(field => (
                <div key={field.key}>
                  <label style={labelStyle}>{field.label}</label>
                  <input
                    type={field.type}
                    value={(form as any)[field.key]}
                    onChange={set(field.key as keyof ProfileForm)}
                    placeholder={field.placeholder}
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'rgba(53,242,168,0.45)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Country */}
        <div style={{ marginBottom: 32 }}>
          <label style={labelStyle}>Country</label>
          <select
            value={form.country}
            onChange={set('country')}
            style={{ ...inputStyle, appearance: 'none' as const }}
          >
            <option value="AU">Australia</option>
            <option value="NZ">New Zealand</option>
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
            <option value="SG">Singapore</option>
            <option value="CA">Canada</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || saved}
          style={{
            width: '100%', padding: '16px', borderRadius: 14, border: 'none',
            background: saved
              ? 'rgba(53,242,168,0.3)'
              : saving
              ? 'rgba(53,242,168,0.35)'
              : 'linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)',
            color: '#050c18', fontSize: 16, fontWeight: 700,
            cursor: saving || saved ? 'not-allowed' : 'pointer',
            boxShadow: saving || saved ? 'none' : '0 0 24px rgba(53,242,168,0.3)',
            transition: 'all 0.2s',
          }}
        >
          {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}