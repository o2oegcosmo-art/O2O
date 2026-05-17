import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, Sparkles, ChevronRight } from 'lucide-react';
import api from '../api/config';
import GoogleMapComponent from '../components/GoogleMapComponent';
import { motion, AnimatePresence } from 'framer-motion';

export default function DiscoveryPage() {
    const [salons, setSalons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [filters, setFilters] = useState({
        governorate: '',
        service_type: '',
        lat: null as number | null,
        lng: null as number | null
    });

    useEffect(() => {
        // محاولة الحصول على الموقع التلقائي
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setFilters(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude }));
            });
        }
    }, []);

    useEffect(() => {
        fetchSalons();
    }, [filters]);

    const fetchSalons = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.governorate) params.append('governorate', filters.governorate);
            if (filters.service_type) params.append('service_type', filters.service_type);
            if (filters.lat) params.append('lat', filters.lat.toString());
            if (filters.lng) params.append('lng', filters.lng.toString());

            const res = await api.get(`/discovery/salons?${params.toString()}`);
            setSalons(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch salons');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0C] text-white pt-24 pb-20 px-6 rtl" dir="rtl">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <span className="bg-fuchsia-500/10 text-fuchsia-500 text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest border border-fuchsia-500/20 mb-4 inline-block">Smart Search Engine</span>
                        <h1 className="text-4xl md:text-6xl font-black mb-4">اكتشف <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-400">أفضل الصالونات</span> حولك</h1>
                        <p className="text-white/40 max-w-2xl mx-auto">احصل على عروض حصرية في أقرب الصالونات لموقعك الجغرافي باستخدام تقنيات الذكاء الاصطناعي.</p>
                    </motion.div>
                </header>

                {/* Search & Filter Bar */}
                <div className="glass p-4 rounded-3xl mb-12 flex flex-col md:flex-row gap-4 border border-white/10 shadow-2xl">
                    <div className="flex-1 relative">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                        <input
                            type="text"
                            placeholder="ابحث عن خدمة (بروتين، قص شعر، ميك اب...)"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 outline-none focus:border-cyan-500 transition-all"
                            value={filters.service_type}
                            onChange={(e) => setFilters({ ...filters, service_type: e.target.value })}
                        />
                    </div>
                    <div className="flex gap-4">
                        <select
                            className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-fuchsia-500 text-white/60"
                            value={filters.governorate}
                            onChange={(e) => setFilters({ ...filters, governorate: e.target.value })}
                        >
                            <option value="">جميع المحافظات</option>
                            <option value="القاهرة">القاهرة</option>
                            <option value="الجيزة">الجيزة</option>
                            <option value="الإسكندرية">الإسكندرية</option>
                            <option value="المنصورة">المنصورة</option>
                        </select>
                        <button
                            onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
                            className="bg-white/10 hover:bg-white/20 px-6 rounded-2xl flex items-center gap-2 transition-all"
                        >
                            <MapPin size={20} />
                            {viewMode === 'list' ? 'عرض الخريطة' : 'عرض القائمة'}
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                {viewMode === 'map' ? (
                    <div className="h-[600px] rounded-[40px] overflow-hidden border border-white/10 shadow-2xl">
                        <GoogleMapComponent
                            markers={salons.map(s => ({
                                lat: Number(s.latitude),
                                lng: Number(s.longitude),
                                title: s.name
                            }))}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence>
                            {salons.map((salon, idx) => (
                                <motion.div
                                    key={salon.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="glass group rounded-[32px] overflow-hidden border border-white/5 hover:border-fuchsia-500/30 transition-all flex flex-col"
                                >
                                    <div className="h-48 bg-black/40 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] to-transparent z-10" />
                                        <img
                                            src={`https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=400`}
                                            alt={salon.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-60"
                                        />
                                        {salon.has_offers && (
                                            <div className="absolute top-4 right-4 z-20 bg-fuchsia-600 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg animate-pulse">
                                                عرض نشط 🔥
                                            </div>
                                        )}
                                        <div className="absolute bottom-4 right-4 z-20">
                                            <h3 className="text-xl font-bold text-white">{salon.name}</h3>
                                            <p className="text-white/60 text-xs flex items-center gap-1"><MapPin size={10} /> {salon.address || 'العنوان غير محدد'}</p>
                                        </div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-1 text-amber-400">
                                                <Star size={14} fill="currentColor" />
                                                <span className="text-xs font-bold text-white">4.8</span>
                                            </div>
                                            <div className="text-[10px] text-cyan-400 font-bold bg-cyan-400/10 px-2 py-1 rounded-md">
                                                {salon.distance_text} بعيداً عنك
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {salon.services?.slice(0, 3).map((s: any) => (
                                                <span key={s.id} className="text-[9px] bg-white/5 border border-white/10 px-2 py-1 rounded-md text-white/40">{s.name}</span>
                                            ))}
                                        </div>
                                        <Link
                                            to={`/salon/${salon.id}`}
                                            className="mt-auto w-full py-4 bg-white/5 group-hover:bg-fuchsia-600 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 border border-white/10 group-hover:border-transparent"
                                        >
                                            احجز الآن <ChevronRight size={16} />
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {salons.length === 0 && !loading && (
                            <div className="col-span-full py-20 text-center">
                                <Sparkles size={48} className="mx-auto text-white/10 mb-4" />
                                <p className="text-white/40">لا توجد صالونات تطابق بحثك حالياً. جرب توسيع نطاق البحث.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
