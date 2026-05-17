import { useState, useEffect } from 'react';
import api from '../api/config';
import toast from 'react-hot-toast';
import { Plus, Megaphone, TrendingUp, Calendar, XCircle } from 'lucide-react';

export default function EventsTab() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [eventForm, setEventForm] = useState({
        title: '',
        description: '',
        image_url: '',
        end_date: '',
        target_audience: 'salon'
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await api.get('/company/events');
            setEvents(res.data.data || []);
        } catch (err) {
            toast.error('فشل تحميل الفعاليات');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/events', eventForm);
            toast.success('تم إنشاء الإعلان بنجاح');
            setShowCreateModal(false);
            setEventForm({ title: '', description: '', image_url: '', end_date: '', target_audience: 'salon' });
            fetchEvents();
        } catch (err) {
            toast.error('فشل إنشاء الإعلان');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="py-20 text-center text-white/40">جاري التحميل...</div>;

    return (
        <div className="space-y-8 text-right rtl" dir="rtl">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">إدارة الإعلانات والفعاليات (Promoted Content)</h2>
                    <p className="text-sm text-white/50">قم بنشر إعلاناتك لصالونات التجميل وراقب التفاعل معها.</p>
                </div>
                <button onClick={() => setShowCreateModal(true)} className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black px-6 py-3 rounded-2xl transition-all flex items-center gap-2">
                    <Plus size={20} /> إنشاء إعلان جديد
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {events.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white/5 border border-white/10 rounded-3xl">
                        <Megaphone size={48} className="mx-auto text-white/10 mb-4" />
                        <p className="text-white/40">لا توجد إعلانات نشطة حالياً</p>
                    </div>
                ) : events.map((event, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6 group hover:border-fuchsia-500/30 transition-all">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className="w-16 h-16 bg-black/40 rounded-2xl overflow-hidden border border-white/5">
                                    <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{event.title}</h3>
                                    <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20">إعلان ممول</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 bg-white/5 text-white/40 rounded-lg hover:text-red-400"><XCircle size={16} /></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-black/40 p-3 rounded-2xl text-center">
                                <p className="text-[10px] text-white/30 mb-1">المشاهدات</p>
                                <p className="text-lg font-black text-white">{event.views || 0}</p>
                            </div>
                            <div className="bg-black/40 p-3 rounded-2xl text-center">
                                <p className="text-[10px] text-white/30 mb-1">النقرات</p>
                                <p className="text-lg font-black text-cyan-400">{event.clicks || 0}</p>
                            </div>
                            <div className="bg-black/40 p-3 rounded-2xl text-center">
                                <p className="text-[10px] text-white/30 mb-1">التفاعل (CTR)</p>
                                <p className="text-lg font-black text-fuchsia-400">{event.views > 0 ? ((event.clicks/event.views)*100).toFixed(1) : 0}%</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-white/30 border-t border-white/5 pt-4">
                            <div className="flex items-center gap-1"><Calendar size={12} /> ينتهي في: {new Date(event.end_date).toLocaleDateString('ar-EG')}</div>
                            <div className="flex items-center gap-1"><TrendingUp size={12} className="text-green-400" /> نمو التفاعل مستقر</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Event Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <div onClick={() => setShowCreateModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                    <div className="relative w-full max-w-md bg-[#121214] border border-white/10 rounded-[40px] p-8">
                        <button onClick={() => setShowCreateModal(false)} className="absolute top-6 left-6 text-white/20 hover:text-white transition-all"><XCircle size={20} /></button>
                        <h3 className="text-2xl font-bold mb-6 text-white text-right">إطلاق حملة إعلانية جديدة</h3>
                        
                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] text-white/40 mr-2 text-right block">عنوان الإعلان</label>
                                <input required value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500 text-right" placeholder="مثال: خصم 30% على منتجات العناية بالبشرة" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-white/40 mr-2 text-right block">رابط صورة الإعلان</label>
                                <input required value={eventForm.image_url} onChange={e => setEventForm({...eventForm, image_url: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500 text-left" placeholder="https://..." />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-white/40 mr-2 text-right block">تاريخ الانتهاء</label>
                                <input type="date" required value={eventForm.end_date} onChange={e => setEventForm({...eventForm, end_date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-white/40 mr-2 text-right block">الوصف</label>
                                <textarea value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white h-24 focus:outline-none focus:border-fuchsia-500 text-right" placeholder="تفاصيل العرض..." />
                            </div>
                            <button disabled={isSubmitting} type="submit" className="w-full bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-fuchsia-600/20 hover:scale-[1.02] transition-all">
                                {isSubmitting ? 'جاري النشر...' : 'إطلاق الإعلان الآن'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
