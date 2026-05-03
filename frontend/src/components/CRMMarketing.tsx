import React, { useState, useEffect } from 'react';
import api from '../api/config';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Send, ShieldCheck, Zap, Lock, Sparkles } from 'lucide-react';

interface Campaign { 
    id: number; 
    name: string; 
    status: string; 
    daily_limit: number; 
    target_category?: string;
    created_at: string; 
}

interface Props {
    isLocked: boolean;
    onUpgrade: () => void;
}

const CRMMarketing: React.FC<Props> = ({ isLocked, onUpgrade }) => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(false);
    const [generatingMsg, setGeneratingMsg] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [campaignForm, setCampaignForm] = useState({ 
        name: '', 
        message_template: '',
        category: 'VIP'
    });

    const [aiParams, setAiParams] = useState({ goal: '', service: '' });

    const loadCampaigns = async () => {
        setLoading(true);
        try {
            const res = await api.get('/whatsapp/campaigns');
            setCampaigns(res.data);
        } catch { 
            toast.error('فشل تحميل الحملات'); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => {
        if (!isLocked) loadCampaigns();
    }, [isLocked]);

    const handleGenerateMsg = async () => {
        if (!aiParams.goal || !aiParams.service) return toast.error('أدخل هدف الحملة والخدمة أولاً');
        setGeneratingMsg(true);
        try {
            const res = await api.post('/whatsapp/generate-message', { 
                campaign_goal: aiParams.goal, 
                service: aiParams.service 
            });
            setCampaignForm(prev => ({ ...prev, message_template: res.data.message }));
            toast.success('✅ تم توليد نص الرسالة بالذكاء الاصطناعي!');
        } catch { 
            toast.error('فشل توليد الرسالة'); 
        } finally { 
            setGeneratingMsg(false); 
        }
    };

    const handleCreateCampaign = async () => {
        if (isLocked) return onUpgrade();
        if (!campaignForm.name || !campaignForm.message_template) return toast.error('أدخل اسم الحملة والرسالة');
        
        setIsSubmitting(true);
        try {
            await api.post('/whatsapp/campaigns', {
                name: campaignForm.name,
                message_template: campaignForm.message_template,
                audience_filter_json: { category: campaignForm.category }
            });
            toast.success('🚀 تم إنشاء الحملة المستهدفة بنجاح!');
            setCampaignForm({ name: '', message_template: '', category: 'VIP' });
            loadCampaigns();
        } catch { 
            toast.error('فشل إنشاء الحملة'); 
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAction = async (id: number, action: 'start' | 'pause') => {
        try {
            await api.post(`/whatsapp/campaigns/${id}/${action}`);
            toast.success(action === 'start' ? '🚀 انطلقت الحملة!' : '⏸️ تم الإيقاف المؤقت');
            loadCampaigns();
        } catch { 
            toast.error('فشل تنفيذ العملية'); 
        }
    };

    return (
        <div className="relative min-h-[600px]">
            {/* Header */}
            <div className="mb-8 text-right">
                <div className="flex items-center gap-3 justify-end mb-2">
                    <h1 className="text-3xl font-black text-white">AI CRM Marketing</h1>
                    <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[10px] font-black px-2 py-1 rounded-md">PRO</div>
                </div>
                <p className="text-white/50 text-sm">استهدف عملائك الحاليين بذكاء بناءً على فئاتهم لزيادة المبيعات</p>
            </div>

            {/* Main Content Area */}
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 transition-all duration-700 ${isLocked ? 'blur-md pointer-events-none grayscale-[0.5]' : ''}`}>
                
                {/* Campaign Creator */}
                <div className="glass rounded-[32px] p-8 border border-white/10 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[80px] -z-10" />
                    
                    <div className="flex items-center gap-3 text-green-400">
                        <Zap size={24} />
                        <h2 className="text-xl font-bold">إنشاء حملة استهداف ذكي</h2>
                    </div>

                    <div className="space-y-4">
                        {/* Target Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/40 block mr-2">من تريد استهدافه؟</label>
                            <select 
                                value={campaignForm.category}
                                onChange={e => setCampaignForm({...campaignForm, category: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-green-500/50 transition-all appearance-none cursor-pointer"
                            >
                                <option value="VIP" className="bg-slate-900">💎 عملاء الـ VIP (الأكثر إنفاقاً)</option>
                                <option value="عميل دائم" className="bg-slate-900">⭐ العملاء الدائمين</option>
                                <option value="جديد" className="bg-slate-900">🆕 العملاء الجدد (للترحيب)</option>
                                <option value="عميل متوقف" className="bg-slate-900">💤 العملاء المنقطعين (لإعادتهم)</option>
                                <option value="all" className="bg-slate-900">🌍 كل العملاء المسجلين</option>
                            </select>
                        </div>

                        {/* AI Writing Assistance */}
                        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 space-y-4">
                            <div className="flex items-center gap-2 text-violet-400 text-xs font-bold">
                                <Sparkles size={14} />
                                <span>مساعد الكتابة بالذكاء الاصطناعي</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input 
                                    placeholder="هدف العرض..." 
                                    value={aiParams.goal}
                                    onChange={e => setAiParams({...aiParams, goal: e.target.value})}
                                    className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500/30" 
                                />
                                <input 
                                    placeholder="الخدمة المرتبطة..." 
                                    value={aiParams.service}
                                    onChange={e => setAiParams({...aiParams, service: e.target.value})}
                                    className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500/30" 
                                />
                            </div>
                            <button 
                                onClick={handleGenerateMsg}
                                disabled={generatingMsg}
                                className="w-full py-3 bg-violet-600/20 border border-violet-500/20 text-violet-300 rounded-xl text-xs font-black hover:bg-violet-600/30 transition-all"
                            >
                                {generatingMsg ? 'جاري صياغة الرسالة...' : 'توليد نص مقترح للفئة المختارة'}
                            </button>
                        </div>

                        <div className="space-y-4">
                            <input 
                                placeholder="اسم الحملة (للإشارة الداخلية)" 
                                value={campaignForm.name}
                                onChange={e => setCampaignForm({...campaignForm, name: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-green-500/50" 
                            />
                            <textarea 
                                rows={5}
                                placeholder="نص رسالة الواتساب..."
                                value={campaignForm.message_template}
                                onChange={e => setCampaignForm({...campaignForm, message_template: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-green-500/50 resize-none"
                            />
                        </div>

                        <button 
                            onClick={handleCreateCampaign}
                            disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black py-5 rounded-[20px] shadow-xl shadow-green-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            {isSubmitting ? 'جاري التحضير...' : 'إطلاق الحملة الموجهة الآن 🚀'}
                        </button>
                    </div>
                </div>

                {/* History & Stats */}
                <div className="space-y-6">
                    <div className="glass rounded-[32px] p-8 border border-white/10">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold">سجل الحملات الذكية</h2>
                            <Users className="text-white/20" />
                        </div>

                        {loading ? (
                            <div className="py-20 text-center text-white/20">جاري تحميل السجلات...</div>
                        ) : campaigns.length === 0 ? (
                            <div className="py-20 text-center">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Send size={24} className="text-white/10" />
                                </div>
                                <p className="text-white/20 text-sm">لم تطلق أي حملات استهداف بعد</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {campaigns.map(c => (
                                    <div key={c.id} className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:bg-white/10 transition-all group">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${c.status === 'sending' ? 'bg-green-500 animate-pulse' : 'bg-white/20'}`} />
                                                <span className="font-bold text-sm">{c.name}</span>
                                            </div>
                                            <span className={`text-[10px] font-black px-2 py-1 rounded bg-white/5 uppercase tracking-wider ${
                                                c.status === 'completed' ? 'text-cyan-400' : 'text-white/40'
                                            }`}>
                                                {c.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-white/40">
                                            <span>المستهدف: <span className="text-white/60">{(c as any).audience_filter_json?.category || c.target_category || 'الكل'}</span></span>
                                            <span>{new Date(c.created_at).toLocaleDateString('ar-EG')}</span>
                                        </div>
                                        
                                        <AnimatePresence>
                                            {c.status === 'draft' || c.status === 'paused' ? (
                                                <motion.button 
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    onClick={() => handleAction(c.id, 'start')}
                                                    className="w-full mt-4 py-2 bg-green-500 text-black font-black rounded-xl text-xs hover:bg-green-400 transition-all"
                                                >
                                                    بدء الإرسال الآن
                                                </motion.button>
                                            ) : c.status === 'sending' ? (
                                                <button 
                                                    onClick={() => handleAction(c.id, 'pause')}
                                                    className="w-full mt-4 py-2 bg-white/10 text-white font-black rounded-xl text-xs hover:bg-white/20 transition-all"
                                                >
                                                    إيقاف مؤقت
                                                </button>
                                            ) : null}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Anti-Ban Info */}
                    <div className="bg-gradient-to-br from-blue-600/20 to-violet-600/20 rounded-[32px] p-6 border border-blue-500/20">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center shrink-0">
                                <ShieldCheck className="text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-blue-300 text-sm mb-1">نظام حماية الحساب (Anti-Ban)</h4>
                                <p className="text-white/50 text-xs leading-relaxed">
                                    نحن نستخدم محرك تأخير ذكي يرسل الرسائل بفواصل زمنية عشوائية تحاكي السلوك البشري الطبيعي، مما يقلل مخاطر حظر رقم الواتساب الخاص بك بنسبة 99%.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upgrade Overlay */}
            {isLocked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 text-center">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass max-w-md p-10 rounded-[40px] border border-white/20 shadow-2xl shadow-black"
                    >
                        <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-amber-500/20">
                            <Lock size={40} className="text-black" />
                        </div>
                        <h2 className="text-3xl font-black mb-4">فتح موديول الاستهداف الذكي</h2>
                        <p className="text-white/60 mb-8 leading-relaxed">
                            هذه الميزة متاحة فقط لأصحاب الصالونات في **الباقة المتقدمة**. 
                            تمكنك من مضاعفة أرباحك عبر إرسال عروض مخصصة لكل فئة من عملائك مباشرة على الواتساب.
                        </p>
                        <button 
                            onClick={onUpgrade}
                            className="w-full bg-white text-black font-black py-5 rounded-2xl hover:bg-amber-400 transition-all shadow-xl"
                        >
                            ترقية الباقة والبدء الآن
                        </button>
                        <button 
                            onClick={() => window.history.back()}
                            className="mt-4 text-white/40 text-sm font-bold hover:text-white transition-all"
                        >
                            العودة للوحة التحكم
                        </button>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default CRMMarketing;
