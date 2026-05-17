import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Send } from 'lucide-react';
import api from '../api/config';

interface Event {
    id: string;
    title: string;
    description: string;
    image_url: string;
    type: string;
    starts_at: string;
    ends_at: string;
    tenant?: { name: string, logo: string | null };
}

const EventsPage: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await api.get('/events');
                const eventData = Array.isArray(res.data) ? res.data : (res.data.data || []);
                setEvents(eventData);
            } catch (err) {
                console.error("Error fetching events", err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
        window.scrollTo(0, 0);
    }, []);

    return (
        <div dir="rtl" className="font-['Inter'] selection:bg-fuchsia-500/30" style={{ minHeight: '100vh', background: '#0A0A0C', color: '#e6e0e9', paddingTop: '8rem', paddingBottom: '6rem' }}>
            {/* Background Orbs */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px]" style={{ background: 'radial-gradient(circle, rgba(192, 38, 211, 0.1) 0%, transparent 70%)' }}></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px]" style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)' }}></div>
            </div>

            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
                <header className="mb-16 text-center">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-['Space_Grotesk'] font-bold text-white mb-6 leading-tight tracking-tight">
                        فاعليات وتدريب
                    </h1>
                    <p className="text-lg text-[#c8c5ca] max-w-2xl mx-auto">
                        أحدث الدورات التدريبية والمؤتمرات الخاصة بقطاع التجميل مقدمة من أكبر الشركات والصالونات في مصر.
                    </p>
                </header>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#c026d3', animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence>
                            {events.map((event, i) => (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:shadow-[0_0_30px_rgba(192,38,211,0.15)] transition-all duration-300 group"
                                >
                                    <div className="relative h-48 overflow-hidden">
                                        <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-fuchsia-400 border border-fuchsia-500/30">
                                            {event.type === 'training' ? 'تدريب' : event.type === 'masterclass' ? 'ماستر كلاس' : 'فاعلية'}
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-white mb-3 font-['Space_Grotesk'] line-clamp-2">{event.title}</h3>
                                        <p className="text-sm text-[#a1a1aa] mb-6 line-clamp-3 leading-relaxed">{event.description}</p>
                                        
                                        <div className="flex items-center gap-2 text-xs text-[#cbc4d2] mb-4">
                                            <Calendar size={14} className="text-cyan-400" />
                                            <span>{new Date(event.starts_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}</span>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-fuchsia-500/20 flex items-center justify-center text-[10px] font-bold text-fuchsia-400">
                                                    {event.tenant?.name?.charAt(0) || 'O'}
                                                </div>
                                                <span className="text-xs font-bold text-[#c8c5ca]">{event.tenant?.name || 'O2OEG'}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button 
                                                    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/events/' + event.id)}`, '_blank')}
                                                    className="p-2 bg-blue-500/10 text-blue-400 rounded-full hover:bg-blue-500 hover:text-white transition-all"
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                                </button>
                                                <button 
                                                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(event.title + ' ' + window.location.origin + '/events/' + event.id)}`, '_blank')}
                                                    className="p-2 bg-green-500/10 text-green-400 rounded-full hover:bg-green-500 hover:text-white transition-all"
                                                >
                                                    <Send size={12} />
                                                </button>
                                                <button className="text-xs font-bold text-cyan-400 hover:text-white transition-colors">
                                                    التفاصيل
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
                
                {!loading && events.length === 0 && (
                    <div className="text-center py-20 text-[#a1a1aa]">
                        لا توجد فاعليات متاحة حالياً.
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventsPage;
