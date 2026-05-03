import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Building2, Users, CheckCircle, ChevronRight, UploadCloud } from 'lucide-react';
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
    logo: '',
    cover: '',
    specialty: 'hair', // for salon
    payout_method: 'vodafone_cash', // for affiliate
    payout_details: '',
    business_reg: '' // for company
  });

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
      await api.post(`/leads/convert/${refCode}`, formData);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
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
      <Toaster position="top-center" theme="dark" />
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl bg-[#121214] border border-white/10 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        {success ? (
          <div className="text-center py-12">
            <CheckCircle size={80} className="text-green-400 mx-auto mb-6" />
            <h2 className="text-3xl font-black mb-4">تم إعداد حسابك بنجاح!</h2>
            <p className="text-white/50 mb-8">جاري توجيهك إلى صفحة الدخول لتبدأ رحلتك معنا...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-fuchsia-600 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-fuchsia-500/20">
                {leadData.interest_type === 'salon' ? <Store size={32} /> : (leadData.interest_type === 'company' ? <Building2 size={32} /> : <Users size={32} />)}
              </div>
              <h1 className="text-3xl font-black mb-2">أهلاً بك، {leadData.name.split(' ')[0]} 👋</h1>
              <p className="text-white/40">يرجى استكمال البيانات التالية لإطلاق لوحة التحكم الخاصة بك</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
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
                      {(leadData.interest_type === 'salon' || leadData.interest_type === 'company') && (
                        <div>
                          <label className="block text-sm font-bold text-white/60 mb-2">الرابط المخصص (Domain)</label>
                          <div className="flex" dir="ltr">
                            <span className="bg-white/5 border border-white/10 border-r-0 px-3 py-3 rounded-l-xl text-white/40 text-sm flex items-center">.o2oeg.com</span>
                            <input required type="text" placeholder="mybrand" className="w-full bg-white/5 border border-white/10 rounded-r-xl px-4 py-3 text-white outline-none focus:border-fuchsia-500 transition-all text-right" value={formData.domain} onChange={e => setFormData({ ...formData, domain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} />
                          </div>
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={() => setStep(2)} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all">التالي <ChevronRight size={18} /></button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                    
                    {leadData.interest_type === 'salon' && (
                      <>
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
                          <input required type="text" style={inputStyle} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                        </div>
                      </>
                    )}

                    {leadData.interest_type === 'company' && (
                      <>
                        <div>
                          <label className="block text-sm font-bold text-white/60 mb-2">رقم السجل التجاري / البطاقة الضريبية</label>
                          <input required type="text" style={inputStyle} value={formData.business_reg} onChange={e => setFormData({ ...formData, business_reg: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-white/60 mb-2">مقر الشركة الرئيسي</label>
                          <input required type="text" style={inputStyle} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                        </div>
                      </>
                    )}

                    {leadData.interest_type === 'affiliate' && (
                      <>
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
                      </>
                    )}

                    <div className="flex gap-4">
                      <button type="button" onClick={() => setStep(1)} className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all text-white/60 hover:text-white">رجوع</button>
                      <button type="submit" disabled={submitting} className="flex-1 py-4 bg-fuchsia-600 hover:bg-fuchsia-500 rounded-2xl font-black text-white shadow-lg shadow-fuchsia-600/20 transition-all">
                        {submitting ? 'جاري إنشاء اللوحة...' : 'حفظ وإطلاق المنصة 🚀'}
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
