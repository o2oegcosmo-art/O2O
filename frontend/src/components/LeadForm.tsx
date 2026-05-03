import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle, Store, Building2, Users as UsersIcon } from 'lucide-react';
import api from '../api/config';

interface LeadFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialInterest: 'salon' | 'company' | 'affiliate';
}

const egyptGovernorates = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر",
  "البحيرة", "الفيوم", "الغربية", "الإسماعيلية", "المنوفية",
  "المنيا", "القليوبية", "الوادي الجديد", "السويس", "الشرقية",
  "دمياط", "بورسعيد", "جنوب سيناء", "كفر الشيخ", "مطروح",
  "الأقصر", "قنا", "شمال سيناء", "سوهاج", "بني سويف", "أسيوط", "أسوان"
];

const interests = [
  { id: 'salon', label: 'صالون', icon: <Store size={22} /> },
  { id: 'company', label: 'شركة', icon: <Building2 size={22} /> },
  { id: 'affiliate', label: 'مسوق', icon: <UsersIcon size={22} /> }
];

const LeadForm: React.FC<LeadFormProps> = ({ isOpen, onClose, initialInterest }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    governorate: '',
    interest_type: initialInterest,
    social_link: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.governorate) { alert('يرجى اختيار المحافظة'); return; }

    const validSocialRegex = /^(https?:\/\/)?(www\.)?(facebook\.com|instagram\.com|tiktok\.com|linkedin\.com)\/.+/i;
    if (!validSocialRegex.test(formData.social_link)) {
      setErrorMessage('عذراً، لأسباب أمنية نقبل فقط الروابط الرسمية (فيسبوك، إنستجرام، تيك توك، لينكدان).');
      setStatus('error');
      return;
    }

    setStatus('loading');
    
    // Check for referral cookie
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
    };
    const refCode = getCookie('o2oeg_ref');

    try {
      await api.post('/leads', { ...formData, ref_code: refCode });
      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
        setFormData({ name: '', phone: '', governorate: '', interest_type: initialInterest, social_link: '', message: '' });
      }, 2000);
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setErrorMessage("لقد قمت بإرسال طلبات كثيرة. يرجى الانتظار دقيقة.");
      } else if (err?.response?.status === 422) {
        const errors = err.response.data.errors;
        const firstError = Object.values(errors)[0] as string[];
        setErrorMessage(firstError[0] || "يرجى التأكد من البيانات المدخلة.");
      } else {
        setErrorMessage("حدث خطأ في الاتصال بالسيرفر، يرجى المحاولة لاحقاً.");
      }
      setStatus('error');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '0.75rem',
    padding: '0.85rem 1rem',
    color: 'var(--text)',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.3s',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(8px)' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="glass-card"
            style={{
              width: '100%', maxWidth: '500px', padding: '2.5rem',
              position: 'relative', zIndex: 10,
              maxHeight: '90vh', overflowY: 'auto',
              borderColor: 'rgba(139,92,246,0.25)'
            }}
          >
            {/* Close */}
            <button onClick={onClose} style={{
              position: 'absolute', top: '1.25rem', left: '1.25rem',
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
              padding: '0.25rem'
            }}>
              <X size={22} />
            </button>

            {status === 'success' ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <CheckCircle size={72} color="var(--primary)" style={{ margin: '0 auto 1.5rem' }} />
                <h3 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>تم الإرسال بنجاح!</h3>
                <p style={{ color: 'var(--text-muted)' }}>سنتواصل معك قريباً جداً على واتساب.</p>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: '1.6rem', fontWeight: '900', textAlign: 'center', marginBottom: '2rem' }}>
                  سجل اهتمامك الآن
                </h3>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Interest Cards */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.75rem', textAlign: 'center' }}>
                      نوع الحساب
                    </label>
                    <div className="interest-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                      {interests.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, interest_type: item.id as 'salon' | 'company' | 'affiliate' })}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                            padding: '0.85rem 0.5rem', borderRadius: '0.75rem',
                            border: formData.interest_type === item.id
                              ? '1px solid var(--primary)'
                              : '1px solid rgba(255,255,255,0.08)',
                            background: formData.interest_type === item.id
                              ? 'rgba(139,92,246,0.12)'
                              : 'rgba(255,255,255,0.03)',
                            color: formData.interest_type === item.id ? 'var(--primary)' : 'var(--text-muted)',
                            transition: 'all 0.3s',
                            cursor: 'pointer',
                            fontFamily: 'inherit'
                          }}
                        >
                          {item.icon}
                          <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name + Phone */}
                  <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem' }}>الاسم</label>
                      <input required type="text" style={inputStyle} value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem' }}>واتساب / موبايل</label>
                      <input required type="tel" placeholder="01xxxxxxxxx" style={inputStyle} value={formData.phone}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9+]/g, '');
                          setFormData({ ...formData, phone: val });
                        }} />
                    </div>
                  </div>

                  {/* Governorate */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem' }}>المحافظة</label>
                    <select required style={{ ...inputStyle, background: 'var(--surface)' }}
                      value={formData.governorate}
                      onChange={e => setFormData({ ...formData, governorate: e.target.value })}>
                      <option value="">اختر المحافظة...</option>
                      {egyptGovernorates.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  {/* Social Link */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                      رابط حسابك (فيسبوك، إنستجرام، تيك توك) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input required type="url" placeholder="https://www.facebook.com/..." style={inputStyle} value={formData.social_link}
                      onChange={e => {
                        setFormData({ ...formData, social_link: e.target.value });
                        if (status === 'error') setStatus('idle'); // Clear error when typing
                      }} />
                  </div>

                  {/* Message */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem' }}>رسالة إضافية (اختياري)</label>
                    <textarea style={{ ...inputStyle, height: '5rem', resize: 'none' }}
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })} />
                  </div>

                  <button type="submit" disabled={status === 'loading'} className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1rem' }}>
                    {status === 'loading' ? 'جاري الإرسال...' : 'إرسال البيانات'}
                    <Send size={18} />
                  </button>

                  {status === 'error' && (
                    <p style={{ color: '#ef4444', textAlign: 'center', fontSize: '0.9rem', fontWeight: '700' }}>
                      {errorMessage || "حدث خطأ، يرجى المحاولة مرة أخرى."}
                    </p>
                  )}
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LeadForm;
