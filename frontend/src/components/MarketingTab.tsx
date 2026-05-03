import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../api/config';
import toast from 'react-hot-toast';
import { Send, Sparkles, Users, BarChart3, Clock } from 'lucide-react';

export default function MarketingTab() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [prompt, setPrompt] = useState('');
    const [generatedMessage, setGeneratedMessage] = useState('');
    const [generating, setGenerating] = useState(false);
    const [sending, setSending] = useState(false);
    const [targetTier, setTargetTier] = useState('all');

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const res = await api.get('/whatsapp/campaigns');
            setCampaigns(res.data.data || []);
        } catch (err) {
            toast.error('فشل تحميل الحملات');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!prompt) return;
        setGenerating(true);
        try {
            const res = await api.post('/whatsapp/generate-message', { 
                campaign_goal: prompt,
                target_segment: targetTier 
            });
            setGeneratedMessage(res.data.message || res.data.generated_message);
            toast.success('تم توليد نص الرسالة بالذكاء الاصطناعي');
        } catch (err) {
            toast.error('فشل توليد الرسالة');
        } finally {
            setGenerating(false);
        }
    };

    const handleSend = async () => {
        if (!generatedMessage) return;
        setSending(true);
        try {
            await api.post('/whatsapp/campaigns', {
                name: `حملة ${new Date().toLocaleDateString('ar-EG')}`,
                message_body: generatedMessage,
                target_segment: targetTier
            });
            toast.success('تم إرسال الحملة بنجاح لجميع الصالونات المستهدفة!');
            setGeneratedMessage('');
            setPrompt('');
            fetchCampaigns();
        } catch (err) {
            toast.error('فشل إرسال الحملة');
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="py-20 text-center text-white/40">جاري التحميل...</div>;

    return (
        <div className="space-y-8 text-right rtl" dir="rtl">
            <header>
                <h2 className="text-2xl font-bold text-white">حملات الواتساب الذكية (AI WhatsApp Marketing)</h2>
                <p className="text-sm text-white/50">استخدم قوة الذكاء الاصطناعي للتواصل مع الصالونات وزيادة مبيعاتك.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Campaign Builder */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gradient-to-br from-fuchsia-600/10 to-cyan-600/10 border border-white/10 rounded-[32px] p-8 space-y-6">
                        <div className="flex items-center gap-3 text-cyan-400">
                            <Sparkles size={24} />
                            <h3 className="font-bold text-white">منشئ الرسائل الذكي</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs text-white/40 mr-2">ما هو هدفك من هذه الحملة؟</label>
                                <textarea 
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="مثال: أريد إرسال عرض خصم 20% للصالونات البلاتينية بمناسبة عيد الفطر على مجموعة كيراتين لوريال..."
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white h-32 focus:outline-none focus:border-cyan-500/50 transition-all"
                                />
                            </div>

                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 space-y-2">
                                    <label className="text-xs text-white/40 mr-2">الفئة المستهدفة</label>
                                    <select 
                                        value={targetTier}
                                        onChange={(e) => setTargetTier(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 appearance-none"
                                    >
                                        <option value="all">جميع الصالونات</option>
                                        <option value="platinum">الصالونات البلاتينية فقط</option>
                                        <option value="regular">الصالونات العادية فقط</option>
                                    </select>
                                </div>
                                <button 
                                    onClick={handleGenerate}
                                    disabled={generating || !prompt}
                                    className="md:mt-6 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-black px-8 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    {generating ? 'جاري التوليد...' : 'توليد النص بالذكاء الاصطناعي'}
                                </button>
                            </div>
                        </div>

                        {generatedMessage && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-6 border-t border-white/5">
                                <div className="space-y-2">
                                    <label className="text-xs text-cyan-400 font-bold mr-2">الرسالة المقترحة:</label>
                                    <div className="w-full bg-black/60 border border-cyan-500/30 rounded-2xl px-5 py-4 text-sm text-white leading-relaxed whitespace-pre-wrap">
                                        {generatedMessage}
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSend}
                                    disabled={sending}
                                    className="w-full bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all"
                                >
                                    {sending ? 'جاري الإرسال...' : <><Send size={20} /> إطلاق الحملة الآن</>}
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Recent Campaigns Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-[32px] p-6">
                        <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                            <Clock size={20} className="text-fuchsia-400" /> حملات سابقة
                        </h3>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                            {campaigns.length === 0 ? (
                                <p className="text-center py-10 text-white/20 text-xs">لا يوجد حملات سابقة</p>
                            ) : campaigns.map((campaign, idx) => (
                                <div key={idx} className="bg-black/40 border border-white/5 p-4 rounded-2xl space-y-3">
                                    <div className="flex justify-between items-start">
                                        <p className="text-xs font-bold text-white">{campaign.name}</p>
                                        <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">مكتملة</span>
                                    </div>
                                    <p className="text-[10px] text-white/40 line-clamp-2">{campaign.message}</p>
                                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                        <div className="flex items-center gap-1 text-[10px] text-cyan-400">
                                            <Users size={12} /> {campaign.sent_count} صالون
                                        </div>
                                        <p className="text-[10px] text-white/20">{new Date(campaign.created_at).toLocaleDateString('ar-EG')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-cyan-500/10 border border-cyan-500/20 p-6 rounded-3xl">
                        <div className="flex items-center gap-3 mb-3 text-cyan-400">
                            <BarChart3 size={20} />
                            <h4 className="font-bold text-sm text-white">إحصائيات التسويق</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] text-white/40">إجمالي الرسائل</p>
                                <p className="text-lg font-black text-white">{campaigns.reduce((acc, c) => acc + c.sent_count, 0)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-white/40">معدل التفاعل</p>
                                <p className="text-lg font-black text-green-400">85%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
