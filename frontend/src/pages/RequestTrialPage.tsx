import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle, Store, Building2, Users as UsersIcon, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/config';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const egyptGovernorates = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر",
  "البحيرة", "الفيوم", "الغربية", "الإسماعيلية", "المنوفية",
  "المنيا", "القليوبية", "الوادي الجديد", "السويس", "الشرقية",
  "دمياط", "بورسعيد", "جنوب سيناء", "كفر الشيخ", "مطروح",
  "الأقصر", "قنا", "شمال سيناء", "سوهاج", "بني سويف", "أسيوط", "أسوان"
];

const interests = [
  { id: 'salon', label: 'صالون', icon: <Store size={24} /> },
  { id: 'company', label: 'شركة', icon: <Building2 size={24} /> },
  { id: 'affiliate', label: 'مسوق', icon: <UsersIcon size={24} /> }
];

const businessTypes = [
  "صالون حريمي",
  "صالون رجالي",
  "مركز تجميل متكامل",
  "براند منتجات تجميل",
  "شركة توريدات",
  "أخرى"
];

const RequestTrialPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    business_name: '',
    business_type: '',
    email: '',
    phone: '',
    governorate: '',
    interest_type: 'salon' as 'salon' | 'company' | 'affiliate',
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
      setErrorMessage('عذراً، نقبل فقط الروابط الرسمية (فيسبوك، إنستجرام، تيك توك، لينكدان).');
      setStatus('error');
      return;
    }

    setStatus('loading');
    
    try {
      await api.post('/leads', formData);
      setStatus('success');
    } catch (err: any) {
      if (err?.response?.status === 422) {
        const errors = err.response.data.errors;
        setErrorMessage((Object.values(errors)[0] as string[])[0]);
      } else {
        setErrorMessage("حدث خطأ، يرجى المحاولة لاحقاً.");
      }
      setStatus('error');
    }
  };

  const inputStyle = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white outline-none focus:border-fuchsia-500 transition-all text-right";

  return (
    <div dir="rtl" className="min-h-screen bg-[#0A0A0C] text-white font-['Inter'] relative overflow-hidden pt-32 pb-20 px-6">
      {/* Decorative Orbs */}
      <div className="fixed top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(192,38,211,0.1)_0%,rgba(10,10,12,0)_70%)] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(6,182,212,0.1)_0%,rgba(10,10,12,0)_70%)] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start relative z-10">
        
        {/* Left Side: Content */}
        <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-xs font-bold tracking-widest uppercase">
            نظام O2OEG للجمال
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight">
            ابدأ رحلتك مع <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">الذكاء الاصطناعي اليوم</span>
          </h1>
          <p className="text-white/60 text-lg max-w-md leading-relaxed">
            انضم لأكثر من 120 صالون وشركة يستخدمون O2OEG لزيادة أرباحهم وتنظيم أعمالهم. احصل على فترة تجريبية مجانية واستمتع بكافة المميزات.
          </p>

          <div className="space-y-6 pt-4">
            {[
              { icon: '🚀', title: 'إعداد فوري', desc: 'سنقوم بتفعيل حسابك خلال أقل من 24 ساعة.' },
              { icon: '🤖', title: 'مساعد ذكي', desc: 'وصول كامل لـ Will AI لتحليل أداء عملك.' },
              { icon: '📱', title: 'ربط واتساب', desc: 'نظام حجز آلي يربطك بعملائك مباشرة.' },
            ].map((feature, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="text-2xl">{feature.icon}</div>
                <div>
                  <h4 className="font-bold text-white">{feature.title}</h4>
                  <p className="text-white/40 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-8">
             <Link to="/" className="text-cyan-400 flex items-center gap-2 font-bold hover:gap-4 transition-all">
               العودة للرئيسية <ArrowRight size={20} />
             </Link>
          </div>
        </motion.div>

        {/* Right Side: Form */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl"
        >
          {status === 'success' ? (
            <div className="py-20 text-center space-y-6">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/20">
                <CheckCircle size={40} className="text-white" />
              </div>
              <h2 className="text-3xl font-black">شكراً لثقتك!</h2>
              <p className="text-white/60">تم استلام طلبك بنجاح. سيقوم أحد مستشارينا بالتواصل معك عبر واتساب خلال ساعات لتفعيل حسابك التجريبي.</p>
              <Link to="/" className="inline-block bg-white/10 px-8 py-3 rounded-xl font-bold">العودة للرئيسية</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold">نموذج طلب التجربة</h2>
                <p className="text-white/40 text-sm mt-2">يرجى ملء البيانات بدقة لنتمكن من خدمتك</p>
              </div>

              {/* Interest Selector */}
              <div className="grid grid-cols-3 gap-4">
                {interests.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, interest_type: item.id as any })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                      formData.interest_type === item.id 
                      ? 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-400' 
                      : 'border-white/5 bg-white/5 text-white/40 hover:border-white/20'
                    }`}
                  >
                    {item.icon}
                    <span className="text-xs font-bold">{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 mr-2">الاسم بالكامل</label>
                  <input required type="text" className={inputStyle} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 mr-2">رقم الواتساب</label>
                  <input required type="tel" className={inputStyle} placeholder="01xxxxxxxxx" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/[^0-9+]/g, '')})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 mr-2">إسم الصالون / الشركة</label>
                  <input required type="text" className={inputStyle} value={formData.business_name} onChange={e => setFormData({...formData, business_name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 mr-2">نوع النشاط</label>
                  <select required className={inputStyle} value={formData.business_type} onChange={e => setFormData({...formData, business_type: e.target.value})}>
                    <option value="">اختر النوع...</option>
                    {businessTypes.map(b => <option key={b} value={b} className="bg-[#0A0A0C]">{b}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 mr-2">المحافظة</label>
                  <select required className={inputStyle} value={formData.governorate} onChange={e => setFormData({...formData, governorate: e.target.value})}>
                    <option value="">اختر المحافظة...</option>
                    {egyptGovernorates.map(g => <option key={g} value={g} className="bg-[#0A0A0C]">{g}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center mr-1">
                    <label htmlFor="email" className="text-xs font-bold text-white/40">البريد الإلكتروني</label>
                    <div className="scale-75 origin-right">
                       <GoogleOAuthProvider clientId="74628165244-7946r60cdkkp9d8jaooa86nie2eemklh.apps.googleusercontent.com">
                          <GoogleLogin
                            onSuccess={credentialResponse => {
                              const decoded: any = jwtDecode(credentialResponse.credential || '');
                              if (decoded.email) {
                                setFormData(prev => ({ ...prev, email: decoded.email, name: decoded.name || prev.name }));
                              }
                            }}
                            onError={() => console.log('Login Failed')}
                            type="icon"
                            shape="circle"
                            theme="filled_blue"
                            size="medium"
                            text="continue_with"
                          />
                       </GoogleOAuthProvider>
                    </div>
                  </div>
                  <input 
                    required 
                    type="email" 
                    name="email"
                    id="email"
                    autoComplete="email" 
                    inputMode="email"
                    className={inputStyle} 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                  />
                  <p className="text-[9px] text-white/20 mt-1">💡 اضغط على أيقونة جوجل أعلاه لملء البيانات تلقائياً</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 mr-2">رابط حسابك (فيسبوك أو إنستجرام)</label>
                <input required type="url" className={inputStyle} placeholder="https://..." value={formData.social_link} onChange={e => setFormData({...formData, social_link: e.target.value})} />
              </div>

              <button 
                type="submit" 
                disabled={status === 'loading'}
                className="w-full bg-gradient-to-r from-fuchsia-600 to-cyan-500 py-4 rounded-xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-fuchsia-500/20 flex items-center justify-center gap-3"
              >
                {status === 'loading' ? 'جاري الإرسال...' : 'بدء التجربة المجانية الآن'}
                <Send size={20} />
              </button>

              {status === 'error' && (
                <p className="text-red-400 text-center text-sm font-bold">{errorMessage}</p>
              )}
            </form>
          )}
        </motion.div>

      </div>
    </div>
  );
};

export default RequestTrialPage;
