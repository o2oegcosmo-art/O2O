import React from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { ConsultantAdvice } from '../../types/salon';

interface AITabProps {
    aiProvider: string;
    fetchWillAIAdvice: () => Promise<void>;
    loadingConsultant: boolean;
    consultantAdvice: ConsultantAdvice | null;
    submitAIFeedback: (type: 'helpful' | 'not_helpful' | 'wrong') => Promise<void>;
    feedbackSent: boolean;
    feedbackComment: string;
    setFeedbackComment: (comment: string) => void;
}

const AITab: React.FC<AITabProps> = ({
    aiProvider,
    fetchWillAIAdvice,
    loadingConsultant,
    consultantAdvice,
    submitAIFeedback,
    feedbackSent,
    feedbackComment,
    setFeedbackComment
}) => {
    return (
        <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter">مستشار <span className="bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">Will AI</span></h2>
                    <p className="text-slate-400 mt-2 font-bold">المحرك الاستراتيجي لنمو أعمالك وتطوير الأداء</p>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
                    <div className={`w-2 h-2 ${aiProvider === 'local' ? 'bg-cyan-400' : aiProvider === 'openrouter' ? 'bg-blue-400' : aiProvider === 'simulated' ? 'bg-amber-500' : 'bg-green-500'} rounded-full animate-pulse`}></div>
                    <span className="text-[10px] font-black uppercase text-white/60 tracking-widest">
                        Model: {aiProvider === 'local_fallback' ? 'Local Strategic Engine (Safety Mode)' : aiProvider === 'local' ? 'Will AI (Local)' : aiProvider === 'openrouter' ? 'Gemini Flash (Free)' : aiProvider === 'groq' ? 'Llama 3 (Groq)' : aiProvider === 'simulated' ? 'Smart Simulation' : 'Gemini 1.5 Pro'}
                    </span>
                </div>
            </div>
            
            {/* AI Consultant Content (Premium Design) */}
            <div className="bg-slate-900/60 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-6 md:p-12 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-violet-600/10 blur-[100px] rounded-full"></div>

                <div className="relative z-10 text-right">
                    <div className="flex items-center gap-4 mb-10 justify-start">
                        <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-cyan-500/20">
                            <Sparkles size={32} />
                        </div>
                        <div className="text-right">
                            <h3 className="text-2xl font-black text-white leading-tight">جاهز لتحليل بياناتك؟</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Strategic Business Intelligence</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 text-right">
                        {[
                            { title: 'تحليل الإيرادات', desc: 'تحديد الخدمات الأكثر ربحية والفرص المفقودة.', icon: 'payments' },
                            { title: 'سلوك العملاء', desc: 'تحليل معدل العودة واقتراح خطط الولاء.', icon: 'group' },
                            { title: 'خطة تسويقية', desc: 'توليد محتوى إعلاني جاهز للنشر فوراً.', icon: 'campaign' }
                        ].map((item, i) => (
                            <div key={i} className="p-5 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-all group">
                                <span className="material-symbols-outlined text-cyan-400 mb-3 block group-hover:scale-110 transition-transform">{item.icon}</span>
                                <p className="text-white font-black text-sm mb-1">{item.title}</p>
                                <p className="text-slate-500 text-[10px] leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={fetchWillAIAdvice}
                        disabled={loadingConsultant}
                        className="w-full md:w-auto px-10 py-5 bg-white text-black font-black rounded-2xl transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {loadingConsultant ? (
                            <>
                                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                                جاري المعالجة...
                            </>
                        ) : (
                            <>ابدأ الاستشارة الاستراتيجية <span className="material-symbols-outlined">bolt</span></>
                        )}
                    </button>
                </div>
            </div>

            {consultantAdvice && (
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 md:p-10 rounded-[3rem] mt-8 shadow-2xl"
                >
                    <div className="flex items-center gap-2 mb-8 text-indigo-400">
                        <Sparkles size={24} />
                        <h3 className="font-bold text-2xl">{consultantAdvice?.title || 'تقرير Will AI الاستراتيجي لصالونك'}</h3>
                    </div>
                    
                    <div className="space-y-8 text-right" dir="rtl">
                        {consultantAdvice?.setup_warning && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 p-4 rounded-xl text-sm font-bold">
                                {consultantAdvice.setup_warning}
                            </div>
                        )}

                        {/* 1. الملخص التنفيذي */}
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-indigo-400">psychology</span>
                                الرؤية العامة
                            </h4>
                            <p className="text-slate-300 leading-relaxed text-lg italic">
                                {consultantAdvice?.summary}
                            </p>
                        </div>

                        {/* 2. رؤى البيانات */}
                        {consultantAdvice?.data_insights && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-2xl">
                                    <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest block mb-1">أكبر فرصة نمو</span>
                                    <p className="text-white font-bold">{consultantAdvice.data_insights?.growth_opportunity}</p>
                                </div>
                                <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl">
                                    <span className="text-xs text-emerald-400 font-bold uppercase tracking-widest block mb-1">خدمة التركيز هذا الأسبوع</span>
                                    <p className="text-white font-bold">{consultantAdvice.data_insights?.target_service}</p>
                                </div>
                            </div>
                        )}

                        {/* 3. العرض المقترح و Sales Hack */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-full overflow-hidden">
                            {consultantAdvice?.suggested_offer && (
                                <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl w-full">
                                    <h4 className="text-amber-400 font-bold mb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined">local_offer</span>
                                        عرض مقترح
                                    </h4>
                                    <p className="text-white font-bold text-sm mb-1">{consultantAdvice.suggested_offer?.title}</p>
                                    <p className="text-slate-400 text-[11px]">{consultantAdvice.suggested_offer?.details}</p>
                                </div>
                            )}
                            {consultantAdvice?.sales_hack && (
                                <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl w-full">
                                    <h4 className="text-rose-400 font-bold mb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined">rocket_launch</span>
                                        فكرة بيعية سريعة (Hack)
                                    </h4>
                                    <p className="text-slate-200 text-sm">{consultantAdvice.sales_hack}</p>
                                </div>
                            )}
                        </div>

                        {/* 4. المحتوى الإبداعي (فيسبوك وواتساب) */}
                        {consultantAdvice?.creative_content && (
                            <div className="space-y-6">
                                <h4 className="text-white font-bold flex items-center gap-2 mt-4">
                                    <span className="material-symbols-outlined text-violet-400">campaign</span>
                                    محتوى تسويقي جاهز للنشر
                                </h4>
                                
                                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 text-right">
                                    <div className="flex justify-between items-center mb-3 flex-row-reverse">
                                        <span className="text-violet-300 text-xs font-bold flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">facebook</span> منشور فيسبوك
                                        </span>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(consultantAdvice.creative_content?.facebook_post || '');
                                                toast.success('تم نسخ النص');
                                            }}
                                            className="text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1 rounded-lg text-white/60 transition-colors"
                                        >
                                            نسخ النص
                                        </button>
                                    </div>
                                    <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                                        {consultantAdvice.creative_content?.facebook_post}
                                    </p>
                                </div>

                                <div className="bg-green-500/5 p-6 rounded-2xl border border-green-500/10 text-right">
                                    <div className="flex justify-between items-center mb-3 flex-row-reverse">
                                        <span className="text-green-400 text-xs font-bold flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">chat</span> رسالة واتساب برودكاست
                                        </span>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(consultantAdvice.creative_content?.whatsapp_broadcast || '');
                                                toast.success('تم نسخ الرسالة');
                                            }}
                                            className="text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1 rounded-lg text-white/60 transition-colors"
                                        >
                                            نسخ النص
                                        </button>
                                    </div>
                                    <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                                        {consultantAdvice.creative_content?.whatsapp_broadcast}
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        {/* نظام التقييم والتدريب */}
                        <div className="mt-8 pt-8 border-t border-white/10">
                            {!feedbackSent ? (
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                        <h4 className="text-sm font-bold text-slate-300">كيف كانت هذه النصيحة؟ (ساعدنا في تدريب Will AI)</h4>
                                        <div className="flex gap-2">
                                            <button onClick={() => submitAIFeedback('helpful')} className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-xl transition-colors border border-green-500/20 flex items-center gap-1 text-xs">
                                                <span className="text-lg">👍</span> مفيدة
                                            </button>
                                            <button onClick={() => submitAIFeedback('not_helpful')} className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-xl transition-colors border border-orange-500/20 flex items-center gap-1 text-xs">
                                                <span className="text-lg">😐</span> عادية
                                            </button>
                                            <button onClick={() => submitAIFeedback('wrong')} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors border border-red-500/20 flex items-center gap-1 text-xs">
                                                <span className="text-lg">👎</span> غير دقيقة
                                            </button>
                                        </div>
                                    </div>
                                    <textarea 
                                        placeholder="أضف ملاحظاتك لتدريب الذكاء الاصطناعي... (اختياري)"
                                        value={feedbackComment}
                                        onChange={(e) => setFeedbackComment(e.target.value)}
                                        className="w-full p-4 text-sm bg-white/5 border border-white/10 rounded-2xl text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px] text-right"
                                        dir="rtl"
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 text-emerald-400 bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20">
                                    <Sparkles size={20} />
                                    <span className="text-sm font-bold">شكراً لك! تم استقبال ملاحظاتك، وسيتعلم Will AI من تقييمك في المرات القادمة.</span>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default AITab;
