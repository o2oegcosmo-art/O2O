import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/config';
import toast from 'react-hot-toast';
import { Calendar, Sparkles, Wand2, RefreshCw, Send, Target, ArrowRight } from 'lucide-react';

export default function SocialStudioTab() {
    const [calendars, setCalendars] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generatingPlan, setGeneratingPlan] = useState(false);
    const [generatingPostId, setGeneratingPostId] = useState<number | null>(null);
    const [activeCalendar, setActiveCalendar] = useState<any>(null);

    useEffect(() => {
        fetchCalendars();
    }, []);

    const fetchCalendars = async () => {
        try {
            const res = await api.get('/content-studio/calendar');
            setCalendars(res.data);
            if (res.data.length > 0) {
                setActiveCalendar(res.data[0]);
            }
        } catch (err) {
            toast.error('فشل تحميل خطة المحتوى');
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePlan = async () => {
        setGeneratingPlan(true);
        try {
            const res = await api.post('/content-studio/generate-plan');
            toast.success('تم بناء خطة المحتوى الأسبوعية بنجاح!');
            fetchCalendars();
        } catch (err) {
            toast.error('فشل توليد الخطة');
        } finally {
            setGeneratingPlan(false);
        }
    };

    const handleGeneratePost = async (postId: number) => {
        setGeneratingPostId(postId);
        try {
            const res = await api.post('/content-studio/generate-post', { post_id: postId });
            toast.success('تم كتابة المحتوى بنجاح!');
            fetchCalendars();
        } catch (err) {
            toast.error('فشل كتابة المحتوى');
        } finally {
            setGeneratingPostId(null);
        }
    };

    const handlePublishPost = async (postId: number) => {
        toast.success('تم جدولة المنشور للنشر التلقائي!');
        // Here you would call the actual publish endpoint: api.post('/social-publisher/publish', { post_id: postId })
    };

    if (loading) return <div className="py-20 text-center text-white/40">جاري التحميل...</div>;

    return (
        <div className="space-y-8 text-right rtl" dir="rtl">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="text-pink-400" /> استوديو المحتوى الذكي (AI Content Lab)
                    </h2>
                    <p className="text-sm text-white/50 mt-1">دع الذكاء الاصطناعي يكتب لك خطة أسبوعية وبوستات احترافية لجذب العملاء.</p>
                </div>
                <button 
                    onClick={handleGeneratePlan}
                    disabled={generatingPlan}
                    className="bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-500 hover:to-fuchsia-500 disabled:opacity-50 text-white font-black px-6 py-3 rounded-2xl transition-all shadow-[0_0_20px_rgba(236,72,153,0.3)] flex items-center gap-2"
                >
                    {generatingPlan ? <RefreshCw className="animate-spin" size={20} /> : <Wand2 size={20} />}
                    {generatingPlan ? 'جاري بناء الخطة...' : 'توليد خطة أسبوعية جديدة'}
                </button>
            </header>

            {calendars.length === 0 ? (
                <div className="bg-white/5 border border-white/10 p-12 rounded-[32px] text-center">
                    <Calendar size={48} className="mx-auto text-white/20 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">لا توجد خطط محتوى حتى الآن</h3>
                    <p className="text-white/40 mb-6 max-w-md mx-auto">اضغط على زر التوليد بالأعلى ليقوم الذكاء الاصطناعي بدراسة نشاطك وإنشاء خطة محتوى مخصصة لك لمدة 7 أيام.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Calendar Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {calendars.map((cal, idx) => (
                            <button
                                key={cal.id}
                                onClick={() => setActiveCalendar(cal)}
                                className={`px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all border ${
                                    activeCalendar?.id === cal.id 
                                        ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' 
                                        : 'bg-white/5 text-white/50 border-transparent hover:bg-white/10'
                                }`}
                            >
                                خطة الأسبوع {calendars.length - idx}
                            </button>
                        ))}
                    </div>

                    {/* Active Calendar Posts */}
                    {activeCalendar && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {activeCalendar.posts.map((post: any) => (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={post.id} 
                                        className="bg-black/40 border border-white/10 rounded-3xl p-6 relative group hover:border-pink-500/30 transition-all flex flex-col"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="text-xs font-black px-3 py-1 rounded-full bg-white/10 text-white/70">
                                                {post.platform}
                                            </span>
                                            <span className="text-[10px] text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                                                {post.post_type}
                                            </span>
                                        </div>
                                        
                                        <h4 className="font-bold text-white text-lg mb-3">{post.title}</h4>
                                        
                                        {post.status === 'idea' ? (
                                            <div className="mt-auto pt-6 text-center">
                                                <button 
                                                    onClick={() => handleGeneratePost(post.id)}
                                                    disabled={generatingPostId === post.id}
                                                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-2xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
                                                >
                                                    {generatingPostId === post.id ? <RefreshCw className="animate-spin" size={16} /> : <Wand2 size={16} className="text-pink-400" />}
                                                    اكتب المحتوى (AI)
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="mt-auto space-y-4 pt-4">
                                                <div className="bg-white/5 p-4 rounded-2xl text-xs text-white/80 leading-relaxed whitespace-pre-wrap h-32 overflow-y-auto">
                                                    {post.content_text}
                                                </div>
                                                <div className="text-[10px] text-cyan-400 font-medium">
                                                    {post.hashtags}
                                                </div>
                                                <button 
                                                    onClick={() => handlePublishPost(post.id)}
                                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-2xl text-sm transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Send size={16} /> نشر أو جدولة
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            )}
            
            {/* AI Ads Advisor */}
            <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 p-8 rounded-[32px] mt-12 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        <Target className="text-indigo-400" /> مستشار الإعلانات الممولّة
                    </h3>
                    <p className="text-sm text-white/60 leading-relaxed max-w-2xl">هل تريد إطلاق حملة ممولة لصالونك ولا تعرف كيف تستهدف؟ الذكاء الاصطناعي لدينا سيقوم بتحليل صالونك وبناء استراتيجية كاملة (الفئة المستهدفة، الميزانية، التصميم) لضمان أعلى عائد.</p>
                </div>
                <button 
                    onClick={() => toast.success('جاري تجهيز استراتيجية الإعلانات الممولة...')}
                    className="bg-indigo-500 hover:bg-indigo-400 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] flex items-center gap-2 whitespace-nowrap"
                >
                    حلل إعلاناتي الآن <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
}
