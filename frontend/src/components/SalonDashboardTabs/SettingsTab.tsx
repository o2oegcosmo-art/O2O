import React from 'react';
import { MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../../api/config';
import GoogleMapComponent from '../GoogleMapComponent';

interface SettingsTabProps {
    salonForm: any;
    setSalonForm: (form: any) => void;
    paymentSettings: any;
    setPaymentSettings: (settings: any) => void;
    handleSettingsSave: () => void;
    isSubmitting: boolean;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
    salonForm,
    setSalonForm,
    paymentSettings,
    setPaymentSettings,
    handleSettingsSave,
    isSubmitting
}) => {
    return (
        <section>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-8">إعدادات الصالون</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 p-6 md:p-8 rounded-[2rem] flex flex-col gap-6">
                    <h3 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                        <span className="material-symbols-outlined">business</span>
                        بيانات الصالون الأساسية
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2 mr-1">اسم الصالون</label>
                            <input type="text" className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-cyan-500 transition-all" value={salonForm.name} onChange={e => setSalonForm({ ...salonForm, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2 mr-1">رقم هاتف التواصل</label>
                            <input type="text" className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-cyan-500 transition-all" value={salonForm.phone} onChange={e => setSalonForm({ ...salonForm, phone: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2 mr-1">العنوان / الموقع</label>
                            <input type="text" className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-cyan-500 transition-all" value={salonForm.address} onChange={e => setSalonForm({ ...salonForm, address: e.target.value })} />
                        </div>
                    </div>

                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 p-6 md:p-8 rounded-[2rem] flex flex-col gap-6">
                    <h3 className="text-xl font-bold text-violet-400 flex items-center gap-2">
                        <span className="material-symbols-outlined">payments</span>
                        سياسة الدفع والحجز
                    </h3>
                    <div className="space-y-4">
                        <label className="flex items-center gap-4 cursor-pointer bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                            <input type="checkbox" className="w-5 h-5 rounded-lg accent-violet-500" checked={paymentSettings.accept_cash} onChange={e => setPaymentSettings({ ...paymentSettings, accept_cash: e.target.checked })} />
                            <span className="text-sm font-bold">قبول الدفع نقداً عند الحضور</span>
                        </label>
                        <label className="flex items-center gap-4 cursor-pointer bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                            <input type="checkbox" className="w-5 h-5 rounded-lg accent-violet-500" checked={paymentSettings.require_deposit} onChange={e => setPaymentSettings({ ...paymentSettings, require_deposit: e.target.checked })} />
                            <span className="text-sm font-bold">تفعيل مقدم الحجز (Deposit)</span>
                        </label>

                        {paymentSettings.require_deposit && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="pt-2">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2 mr-1">قيمة المقدم (ج.م)</label>
                                <input type="number" className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-violet-500 transition-all" value={paymentSettings.deposit_amount} onChange={e => setPaymentSettings({ ...paymentSettings, deposit_amount: Number(e.target.value) })} />
                            </motion.div>
                        )}

                        <div>
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2 mr-1">تعليمات الدفع للعملاء</label>
                            <textarea className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-violet-500 transition-all min-h-[120px]" placeholder="مثال: يرجى تحويل مبلغ المقدم على رقم فودافون كاش..." value={paymentSettings.payment_instructions} onChange={e => setPaymentSettings({ ...paymentSettings, payment_instructions: e.target.value })}></textarea>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 p-6 md:p-8 rounded-[2rem] flex flex-col gap-6 lg:col-span-2">
                    <h3 className="text-xl font-bold text-pink-400 flex items-center gap-2">
                        <span className="material-symbols-outlined">share</span>
                        إعدادات السوشيال ميديا (SEO)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2 mr-1">الوصف التسويقي (يظهر عند مشاركة الرابط)</label>
                                <textarea className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-pink-500 transition-all min-h-[100px]" placeholder="اكتب وصفاً جذاباً لصالونك..." value={salonForm.description} onChange={e => setSalonForm({ ...salonForm, description: e.target.value })}></textarea>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-3 mr-1">صورة المشاركة الاجتماعية</label>
                                
                                <div className="relative group rounded-2xl overflow-hidden border border-white/10 bg-black/40 mb-3 min-h-[80px]">
                                    {salonForm.og_image_url ? (
                                        <>
                                            <img
                                                src={salonForm.og_image_url}
                                                className="w-full h-auto block"
                                                style={{ maxHeight: '300px', objectFit: 'contain', background: 'rgba(0,0,0,0.5)' }}
                                                alt="Social Preview"
                                            />
                                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all gap-2">
                                                <span className="material-symbols-outlined text-white text-3xl">upload</span>
                                                <span className="text-white text-xs font-bold">تغيير الصورة</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    const formData = new FormData();
                                                    formData.append('image', file);
                                                    try {
                                                        toast.loading('جاري رفع الصورة...');
                                                        const res = await api.post('/upload-image', formData);
                                                        setSalonForm({...salonForm, og_image_url: res.data.url});
                                                        toast.dismiss();
                                                        toast.success('تم رفع الصورة بنجاح');
                                                    } catch (err) {
                                                        toast.dismiss();
                                                        toast.error('فشل رفع الصورة');
                                                    }
                                                }} />
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setSalonForm({...salonForm, og_image_url: ''})}
                                                className="absolute top-2 left-2 w-8 h-8 bg-red-600/80 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                        </>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center gap-3 py-10 cursor-pointer hover:bg-white/5 transition-all">
                                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-white/30 text-3xl">add_photo_alternate</span>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-white/50 text-sm font-bold">اضغط لرفع الصورة</p>
                                                <p className="text-white/20 text-[10px] mt-1">PNG, JPG, WEBP — أي مقاس مقبول</p>
                                            </div>
                                            <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const formData = new FormData();
                                                formData.append('image', file);
                                                try {
                                                    toast.loading('جاري رفع الصورة...');
                                                    const res = await api.post('/upload-image', formData);
                                                    setSalonForm({...salonForm, og_image_url: res.data.url});
                                                    toast.dismiss();
                                                    toast.success('تم رفع الصورة بنجاح');
                                                } catch (err) {
                                                    toast.dismiss();
                                                    toast.error('فشل رفع الصورة');
                                                }
                                            }} />
                                        </label>
                                    )}
                                </div>
                                <p className="text-[10px] text-white/30 leading-relaxed">تظهر للعملاء عند مشاركة رابط صالونك على واتساب أو فيسبوك. الأفضل: 1200×630 بكسل.</p>
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-4">معاينة شكل الرابط (Preview)</p>
                            <div className="bg-[#1c1e21] rounded-xl overflow-hidden border border-[#3e4042] shadow-2xl scale-95 origin-top">
                                <div className="bg-slate-800 min-h-[80px]">
                                    {salonForm.og_image_url ? (
                                        <img src={salonForm.og_image_url} className="w-full h-auto" style={{ maxHeight: '160px', objectFit: 'contain', background: '#1a1a2e' }} alt="Preview" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-600/20 to-pink-600/20 text-white/10">
                                            <span className="material-symbols-outlined text-5xl">spa</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 text-right" dir="rtl">
                                    <p className="text-[10px] text-[#bcc0c4] uppercase">O2OEG.COM</p>
                                    <h4 className="text-white font-bold text-sm truncate">{salonForm.name || 'اسم الصالون'} | O2OEG</h4>
                                    <p className="text-[#bcc0c4] text-xs line-clamp-2 mt-1">{salonForm.description || 'احجز موعدك الآن واستمتع بأفضل خدمات التجميل الذكية...'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Google Maps Location Section */}
            <div className="glass mt-8 p-8 rounded-[32px] border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400">
                        <MapPin size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">موقع الصالون الجغرافي</h3>
                        <p className="text-sm text-white/40">حدد موقعك بدقة على الخريطة ليتمكن العملاء من الوصول إليك بسهولة.</p>
                    </div>
                </div>

                <div className="rounded-[24px] overflow-hidden border border-white/5 mb-4 h-[400px]">
                    <GoogleMapComponent 
                        isEditable={true} 
                        lat={salonForm.latitude || undefined} 
                        lng={salonForm.longitude || undefined} 
                        onLocationSelect={(lat, lng) => setSalonForm({...salonForm, latitude: lat, longitude: lng})}
                    />
                </div>
                <div className="flex gap-4">
                    <div className="flex-1 bg-black/40 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-white/30 uppercase mb-1">خط العرض (Latitude)</p>
                        <p className="font-mono text-cyan-400">{salonForm.latitude || 'لم يتم التحديد'}</p>
                    </div>
                    <div className="flex-1 bg-black/40 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-white/30 uppercase mb-1">خط الطول (Longitude)</p>
                        <p className="font-mono text-cyan-400">{salonForm.longitude || 'لم يتم التحديد'}</p>
                    </div>
                </div>
            </div>
            <div className="flex justify-end mt-8">
                <button onClick={handleSettingsSave} disabled={isSubmitting} className="bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold px-8 py-4 rounded-xl hover:scale-105 transition-all">
                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ كافة الإعدادات'}
                </button>
            </div>
        </section>
    );
};

export default SettingsTab;
