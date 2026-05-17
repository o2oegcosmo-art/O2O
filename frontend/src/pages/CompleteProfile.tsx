import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Building2, Users, CheckCircle, ChevronRight } from 'lucide-react';
import api from '../api/config';
import toast, { Toaster } from 'react-hot-toast';

const CompleteProfile: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const refCode = searchParams.get('ref');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [leadData, setLeadData] = useState<any>(null);

  const [formData, setFormData] = useState({
    domain: '',
    password: '',
    confirmPassword: '',
    description: '',
    address: '',
    logo_url: '',
    cover_url: '',
    owner_photo_url: '',
    theme: 'rose_gold', // Default VIP theme
    specialty: 'hair', // for salon
    payout_method: 'vodafone_cash', // for affiliate
    payout_details: '',
    business_reg: '' // for company
  });

  // Dynamic Popular Services list based on Specialty
  const [selectedServices, setSelectedServices] = useState<any[]>([]);

  const defaultServicesMap: Record<string, { name: string; price: number; duration: number }[]> = {
    hair: [
      { name: 'قص شعر وتصفيف سشوار', price: 150, duration: 45 },
      { name: 'سشوار وبيبي ليس كيرلي', price: 200, duration: 30 },
      { name: 'صبغة شعر كاملة ألوان بريميوم', price: 850, duration: 90 },
      { name: 'جلسة معالجة بروتين وفيلر', price: 1200, duration: 120 },
    ],
    beauty: [
      { name: 'ميك أب سواريه كامل احترافي', price: 950, duration: 60 },
      { name: 'تركيب أظافر أكريليك مع لون', price: 350, duration: 45 },
      { name: 'تنظيف بشرة عميق هيدرافيشيل', price: 600, duration: 60 },
      { name: 'جلسة رسم مايكروبليدنج حواجب', price: 1500, duration: 75 },
    ],
    spa: [
      { name: 'جلسة مساج استرخائي بالزيوت العطرية', price: 450, duration: 60 },
      { name: 'حمام مغربي ملكي بالصابون البلدي', price: 750, duration: 90 },
      { name: 'تقشير وتنظيف الجسم بالدلكة السودانية', price: 500, duration: 60 },
      { name: 'جلسة ساونا وبخار ساخن', price: 300, duration: 45 },
    ],
    clinic: [
      { name: 'جلسة تقشير فراكشنال ليزر للوجه', price: 1100, duration: 45 },
      { name: 'جلسة حقن فيلر وتعبئة شفايف', price: 2400, duration: 30 },
      { name: 'جلسة حقن بوتوكس للتجاعيد', price: 1800, duration: 30 },
      { name: 'جلسة تنظيف وتطهير طبي مجهري', price: 700, duration: 60 },
    ],
  };

  useEffect(() => {
    // Populate default services whenever specialty changes
    const list = defaultServicesMap[formData.specialty] || [];
    setSelectedServices(list.map(s => ({ ...s, selected: true })));
  }, [formData.specialty]);

  useEffect(() => {
    if (!refCode) {
      toast.error('رابط غير صالح');
      setLoading(false);
      return;
    }

    const fetchLead = async () => {
      try {
        const res = await api.get(`/leads/verify/${refCode}`);
        setLeadData(res.data);
      } catch (err) {
        toast.error('رابط منتهي الصلاحية أو غير صالح');
      } finally {
        setLoading(false);
      }
    };
    fetchLead();
  }, [refCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('كلمة المرور غير متطابقة');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        services: selectedServices.filter(s => s.selected).map(s => ({
          name: s.name,
          price: s.price,
          duration: s.duration
        }))
      };
      const res = await api.post(`/leads/convert/${refCode}`, payload);
      setSuccess(true);
      
      // 🚀 AUTO-LOGIN: Save the token and user data returned from the backend
      if (res.data.access_token) {
        localStorage.setItem('o2oeg_token', res.data.access_token);
        localStorage.setItem('o2oeg_user', JSON.stringify(res.data.user));
        
        const destination = res.data.user.business_category === 'company' ? '/company' : '/salon';
        setTimeout(() => navigate(destination), 3000);
      } else {
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء حفظ البيانات');
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px', padding: '12px 16px', color: '#fff', outline: 'none', transition: 'all 0.3s'
  };

  if (loading) return <div className="h-screen bg-[#0A0A0C] flex items-center justify-center text-white">جاري التحميل...</div>;
  if (!leadData) return <div className="h-screen bg-[#0A0A0C] flex flex-col items-center justify-center text-white"><h2 className="text-2xl font-bold mb-4">الرابط غير صالح</h2><button onClick={() => navigate('/')} className="text-fuchsia-400">العودة للرئيسية</button></div>;

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white flex flex-col items-center justify-center p-4 md:p-8" dir="rtl">
      <Toaster position="top-center" />
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl bg-[#121214] border border-white/10 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        {success ? (
          <div className="text-center py-12">
            <CheckCircle size={80} className="text-green-400 mx-auto mb-6" />
            <h2 className="text-3xl font-black mb-4">تم إعداد حسابك بنجاح!</h2>
            <p className="text-white/50 mb-8">جاري توجيهك إلى لوحة التحكم لتبدأ رحلتك معنا...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-fuchsia-600 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-fuchsia-500/20">
                {leadData.interest_type === 'salon' ? <Store size={32} /> : (leadData.interest_type === 'company' ? <Building2 size={32} /> : <Users size={32} />)}
              </div>
              <h1 className="text-3xl font-black mb-2">أهلاً بك، {leadData.name.split(' ')[0]} 👋</h1>
              <p className="text-white/40">يرجى استكمال البيانات التالية لإطلاق لوحة التحكم الخاصة بك</p>
              
              {/* Stepper indicator */}
              <div className="flex items-center justify-center gap-4 mt-6">
                <span className={`w-3 h-3 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-cyan-500 scale-125' : 'bg-white/20'}`} />
                <span className="w-8 h-0.5 bg-white/10" />
                <span className={`w-3 h-3 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-cyan-500 scale-125' : 'bg-white/20'}`} />
                {leadData.interest_type === 'salon' && (
                  <>
                    <span className="w-8 h-0.5 bg-white/10" />
                    <span className={`w-3 h-3 rounded-full transition-all duration-300 ${step >= 3 ? 'bg-cyan-500 scale-125' : 'bg-white/20'}`} />
                  </>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-white/60 mb-2">اسم المستخدم (الموبايل)</label>
                        <input type="text" value={leadData.phone} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-white/60 mb-2">كلمة المرور الجديدة</label>
                        <input required type="password" style={inputStyle} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-white/60 mb-2">تأكيد كلمة المرور</label>
                        <input required type="password" style={inputStyle} value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} />
                      </div>
                    </div>
                    <button type="button" onClick={() => setStep(2)} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all">التالي <ChevronRight size={18} /></button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                    
                    {leadData.interest_type === 'salon' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-bold text-white/60 mb-2">التخصص الرئيسي</label>
                            <select style={inputStyle} value={formData.specialty} onChange={e => setFormData({ ...formData, specialty: e.target.value })}>
                              <option value="hair">صالون شعر وعناية</option>
                              <option value="beauty">مركز تجميل متكامل</option>
                              <option value="spa">سبا ومساج</option>
                              <option value="clinic">عيادة تجميل طبية</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-white/60 mb-2">العنوان التفصيلي</label>
                            <input required type="text" style={inputStyle} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="مثال: مصر الجديدة، القاهرة" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-white/60 mb-2">وصف مختصر لموقعك (الكلمات الترحيبية)</label>
                            <textarea style={{ ...inputStyle, resize: 'none', height: '80px' }} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="مثال: صالون يقدم أرقى خدمات العناية بالشعر والبشرة بأحدث الصيحات العالمية..." />
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <button type="button" onClick={() => setStep(1)} className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all text-white/60 hover:text-white">رجوع</button>
                          <button type="button" onClick={() => setStep(3)} className="flex-1 py-4 bg-fuchsia-600 hover:bg-fuchsia-500 rounded-2xl font-black text-white shadow-lg transition-all flex items-center justify-center gap-2">التالي: المظهر والهوية <ChevronRight size={18} /></button>
                        </div>
                      </>
                    )}

                    {leadData.interest_type === 'company' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-bold text-white/60 mb-2">رقم السجل التجاري / البطاقة الضريبية</label>
                            <input required type="text" style={inputStyle} value={formData.business_reg} onChange={e => setFormData({ ...formData, business_reg: e.target.value })} />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-white/60 mb-2">مقر الشركة الرئيسي</label>
                            <input required type="text" style={inputStyle} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <button type="button" onClick={() => setStep(1)} className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all text-white/60 hover:text-white">رجوع</button>
                          <button type="submit" disabled={submitting} className="flex-1 py-4 bg-fuchsia-600 hover:bg-fuchsia-500 rounded-2xl font-black text-white shadow-lg transition-all">
                            {submitting ? 'جاري إعداد اللوحة...' : 'حفظ وإطلاق المنصة 🚀'}
                          </button>
                        </div>
                      </>
                    )}

                    {leadData.interest_type === 'affiliate' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-bold text-white/60 mb-2">طريقة استلام الأرباح</label>
                            <select style={inputStyle} value={formData.payout_method} onChange={e => setFormData({ ...formData, payout_method: e.target.value })}>
                              <option value="vodafone_cash">فودافون كاش</option>
                              <option value="instapay">Instapay</option>
                              <option value="bank">تحويل بنكي</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-white/60 mb-2">رقم المحفظة / Instapay Handle</label>
                            <input required type="text" style={inputStyle} value={formData.payout_details} onChange={e => setFormData({ ...formData, payout_details: e.target.value })} />
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <button type="button" onClick={() => setStep(1)} className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all text-white/60 hover:text-white">رجوع</button>
                          <button type="submit" disabled={submitting} className="flex-1 py-4 bg-fuchsia-600 hover:bg-fuchsia-500 rounded-2xl font-black text-white shadow-lg transition-all">
                            {submitting ? 'جاري إعداد اللوحة...' : 'حفظ وإطلاق المنصة 🚀'}
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {step === 3 && leadData.interest_type === 'salon' && (
                  <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                    
                    {/* Visual Media Section */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4">
                      <h3 className="text-md font-bold text-cyan-400">✨ رفع صور الهوية والمظهر (البث الفوري)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-white/50 mb-1.5">شعار الصالون (Logo URL)</label>
                          <input type="text" style={{ ...inputStyle, padding: '8px 12px', fontSize: '12px' }} value={formData.logo_url} onChange={e => setFormData({ ...formData, logo_url: e.target.value })} placeholder="رابط صورة الشعار..." />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-white/50 mb-1.5">صورة صاحب الصالون (Owner Photo URL)</label>
                          <input type="text" style={{ ...inputStyle, padding: '8px 12px', fontSize: '12px' }} value={formData.owner_photo_url} onChange={e => setFormData({ ...formData, owner_photo_url: e.target.value })} placeholder="رابط صورتك للدعاية..." />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-white/50 mb-1.5">صورة الغلاف للصالون (Cover URL)</label>
                          <input type="text" style={{ ...inputStyle, padding: '8px 12px', fontSize: '12px' }} value={formData.cover_url} onChange={e => setFormData({ ...formData, cover_url: e.target.value })} placeholder="رابط صورة الصالون..." />
                        </div>
                      </div>
                      <p className="text-[10px] text-white/30 text-center mt-2">💡 لو مفيش شعار جاهز؟ لا تقلق، هيقوم النظام تلقائياً برسم لوجو دائري فاخر بحروف صالونك!</p>
                    </div>

                    {/* Luxury Theme Selector */}
                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-white/60">👑 اختر ثيم ألوان موقع صالونك الإلكتروني</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { key: 'rose_gold', name: 'الروز جولد', desc: 'للصالونات النسائية والميك أب', color: '#B76E79' },
                          { key: 'royal_gold', name: 'الذهبي والأسود', desc: 'VIP والخدمات الفاخرة', color: '#D4AF37' },
                          { key: 'emerald_green', name: 'الأخضر الزمردي', desc: 'لسبا ومراكز العناية', color: '#50C878' },
                          { key: 'navy_silver', name: 'الأزرق والفضي', desc: 'للصالونات الرجالية والـ Barber', color: '#000080' },
                        ].map((t) => (
                          <button
                            key={t.key}
                            type="button"
                            onClick={() => setFormData({ ...formData, theme: t.key })}
                            className={`p-3 bg-white/5 rounded-2xl border text-right transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-20 ${formData.theme === t.key ? 'border-cyan-500 shadow-md shadow-cyan-500/10 scale-102 bg-white/10' : 'border-white/10 hover:border-white/20'}`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-black">{t.name}</span>
                              <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: t.color }} />
                            </div>
                            <span className="text-[9px] text-white/40 leading-tight block mt-1">{t.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Services Selector */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-3">
                      <label className="block text-sm font-black text-cyan-400">✂️ اختر خدماتك وحدد أسعارك فوراُ</label>
                      <div className="space-y-2.5 max-h-48 overflow-y-auto pr-2">
                        {selectedServices.map((srv, index) => (
                          <div key={index} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-2.5 hover:bg-white/10 transition-colors">
                            <label className="flex items-center gap-3 cursor-pointer text-xs font-bold">
                              <input
                                type="checkbox"
                                checked={srv.selected}
                                onChange={e => {
                                  const updated = [...selectedServices];
                                  updated[index].selected = e.target.checked;
                                  setSelectedServices(updated);
                                }}
                                className="w-4 h-4 rounded text-cyan-500 bg-white/10 border-white/10 focus:ring-transparent"
                              />
                              <span>{srv.name}</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={srv.price}
                                onChange={e => {
                                  const updated = [...selectedServices];
                                  updated[index].price = Number(e.target.value);
                                  setSelectedServices(updated);
                                }}
                                className="w-20 bg-black/40 border border-white/10 rounded-lg py-1 px-2 text-xs text-center text-cyan-400 font-bold outline-none focus:border-cyan-500"
                              />
                              <span className="text-[10px] text-white/40">ج.م</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button type="button" onClick={() => setStep(2)} className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all text-white/60 hover:text-white">رجوع</button>
                      <button type="submit" disabled={submitting} className="flex-1 py-4 bg-gradient-to-r from-fuchsia-600 to-cyan-600 hover:from-fuchsia-500 hover:to-cyan-500 rounded-2xl font-black text-white shadow-lg shadow-fuchsia-500/20 transition-all">
                        {submitting ? 'جاري بناء موقع صالونك الفاخر...' : 'حفظ وإطلاق الموقع الإلكتروني 🚀'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default CompleteProfile;
