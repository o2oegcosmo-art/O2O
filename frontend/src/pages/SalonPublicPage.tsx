import { useState, useEffect, FC, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Clock,
    MapPin,
    Star,
    ArrowLeft,
    Phone,
    ChevronRight
} from 'lucide-react';
import api from '../api/config';
import { toast } from 'react-hot-toast';

const SalonPublicPage: FC = () => {
    const { id } = useParams();
    const [salon, setSalon] = useState<any>(null);
    const [services, setServices] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'services' | 'products'>('services');
    const [selectedService, setSelectedService] = useState<any>(null);
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [bookingForm, setBookingForm] = useState({
        customer_name: '',
        customer_phone: '',
        booking_date: '',
        notes: ''
    });
    const [isOrderOpen, setIsOrderOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [isAIChatOpen, setIsAIChatOpen] = useState(false);
    const [aiQuery, setAiQuery] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [orderForm, setOrderForm] = useState({
        customer_name: '',
        customer_phone: '',
        address: '',
        quantity: 1
    });

    useEffect(() => {
        fetchSalonData();
    }, [id]);

    const fetchSalonData = async () => {
        try {
            const res = await api.get(`/salons/${id}/public`);
            setSalon(res.data.salon);
            setServices(res.data.services);
            setProducts(res.data.products);
        } catch (err) {
            console.error('Failed to load salon data:', err);
            setError('عذراً، هذا الصالون غير متاح أو الرابط غير صحيح.');
        } finally {
            setLoading(false);
        }
    };

    const handleBooking = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/salons/${id}/book`, {
                ...bookingForm,
                service_id: selectedService.id
            });
            toast.success('تم استلام طلب الحجز بنجاح!');
            setIsBookingOpen(false);
            setBookingForm({ customer_name: '', customer_phone: '', booking_date: '', notes: '' });
        } catch (err) {
            toast.error('فشل إرسال طلب الحجز');
        }
    };

    const handleOrder = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/salons/${id}/order`, {
                ...orderForm,
                product_id: selectedProduct.id
            });
            toast.success('تم استلام طلب الشراء! سنتواصل معك للتأكيد.');
            setIsOrderOpen(false);
            setOrderForm({ customer_name: '', customer_phone: '', address: '', quantity: 1 });
        } catch (err) {
            toast.error('فشل إرسال طلب الشراء');
        }
    };

    const askWillAI = async () => {
        if (!aiQuery.trim()) return;
        setIsAiLoading(true);
        setAiResponse('');
        try {
            const res = await api.post('/salons/ai-consult', { 
                query: aiQuery,
                context: { salon_id: id }
            });
            setAiResponse(res.data.response);
        } catch {
            setAiResponse('عذراً، واجهت مشكلة في الاتصال بمحرك الذكاء الاصطناعي. حاول مرة أخرى.');
        } finally {
            setIsAiLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    if (!salon || error) {
        return (
            <div className="min-h-screen bg-[#0A0A0C] text-white flex flex-col items-center justify-center p-6 text-center" dir="rtl">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6">
                    <Star size={40} className="opacity-50" />
                </div>
                <h2 className="text-3xl font-black mb-4">الصالون غير موجود</h2>
                <p className="text-white/40 max-w-md">{error || 'عذراً، لم نتمكن من العثور على الصالون المطلوب. تأكد من صحة الرابط.'}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0A0C] text-white pb-20 overflow-x-hidden" dir="rtl">

            {/* Hero Header */}
            <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-transparent to-black/50 z-10" />
                <img
                    src={salon.logo_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=2000'}
                    alt={salon.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-20 max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center gap-2">
                            <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-black px-3 py-1 rounded-full border border-cyan-500/30 backdrop-blur-md">
                                {salon.business_category === 'women_salon' ? 'صالون نسائي' : 'مركز تجميل'}
                            </span>
                            <div className="flex items-center gap-1 text-yellow-400">
                                <Star size={12} fill="currentColor" />
                                <span className="text-xs font-bold">4.9 (120+ تقييم)</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl md:text-6xl font-black tracking-tight">{salon.name}</h1>
                            {salon.status === 'active' && (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full mt-2 md:mt-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Verified by O2OEG</span>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-6 text-sm text-white/60">
                            <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-cyan-400" />
                                <span>{salon.address || 'القاهرة، مصر'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={16} className="text-fuchsia-400" />
                                <span>{salon.phone || 'تواصل معنا'}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="sticky top-0 z-40 bg-[#0A0A0C]/80 backdrop-blur-2xl border-b border-white/5 px-6">
                <div className="max-w-7xl mx-auto flex items-center justify-center gap-8">
                    <button
                        onClick={() => setActiveTab('services')}
                        className={`py-6 text-sm font-bold transition-all relative ${activeTab === 'services' ? 'text-cyan-400' : 'text-white/40 hover:text-white'}`}
                    >
                        الخدمات والحجز
                        {activeTab === 'services' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500 rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`py-6 text-sm font-bold transition-all relative ${activeTab === 'products' ? 'text-cyan-400' : 'text-white/40 hover:text-white'}`}
                    >
                        متجر المنتجات
                        {activeTab === 'products' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500 rounded-t-full" />}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                <AnimatePresence mode="wait">
                    {activeTab === 'services' ? (
                        <motion.div
                            key="services"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {services.map((service, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-white/5 border border-white/10 rounded-[2rem] p-6 hover:border-cyan-500/30 transition-all flex flex-col"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 rounded-2xl flex items-center justify-center text-cyan-400">
                                            <Calendar size={24} />
                                        </div>
                                        <span className="text-xl font-black text-white">{parseFloat(service.price).toLocaleString()} ج.م</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>
                                    <p className="text-sm text-white/40 mb-6 line-clamp-2">{service.description || 'احصل على أفضل تجربة عناية واحترافية مع خبرائنا.'}</p>
                                    <div className="flex items-center gap-4 text-xs text-white/40 mb-8">
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={14} className="text-cyan-400" />
                                            <span>{service.duration || '45'} دقيقة</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Star size={14} className="text-yellow-400" fill="currentColor" />
                                            <span>أفضل خدمة</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setSelectedService(service); setIsBookingOpen(true); }}
                                        className="mt-auto w-full py-4 bg-white/5 hover:bg-cyan-500 hover:text-black font-bold rounded-2xl transition-all border border-white/10 hover:border-transparent flex items-center justify-center gap-2"
                                    >
                                        احجز الآن
                                        <ChevronRight size={18} />
                                    </button>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="products"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                        >
                            {products.map((product, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ y: -5 }}
                                    className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden group"
                                >
                                    <div className="h-64 relative overflow-hidden">
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="p-6">
                                        <h3 className="font-bold text-white mb-1">{product.name}</h3>
                                        <p className="text-xs text-white/40 mb-4 line-clamp-1">{product.description}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-black text-cyan-400">{parseFloat(product.wholesale_price).toLocaleString()} ج.م</span>
                                            <button 
                                                onClick={() => { setSelectedProduct(product); setIsOrderOpen(true); }}
                                                className="bg-white/10 hover:bg-cyan-500 hover:text-black px-4 py-2 rounded-xl text-[10px] font-bold transition-all"
                                            >
                                                شراء الآن
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Booking Modal */}
            <AnimatePresence>
                {isBookingOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsBookingOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-xl bg-[#121216] border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
                        >
                            <div className="p-8 md:p-12">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h2 className="text-3xl font-black mb-2 text-white">حجز موعد</h2>
                                        <p className="text-white/40 text-sm">أنت تقوم بحجز: <span className="text-cyan-400 font-bold">{selectedService?.name}</span></p>
                                    </div>
                                    <button onClick={() => setIsBookingOpen(false)} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                                        <ArrowLeft size={24} />
                                    </button>
                                </div>
                                <form onSubmit={handleBooking} className="space-y-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-white/40 mb-2 block">الاسم بالكامل</label>
                                            <input
                                                required
                                                type="text"
                                                value={bookingForm.customer_name}
                                                onChange={e => setBookingForm({ ...bookingForm, customer_name: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                                                placeholder="أدخل اسمك..."
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-white/40 mb-2 block">رقم الهاتف</label>
                                            <input
                                                required
                                                type="tel"
                                                value={bookingForm.customer_phone}
                                                onChange={e => setBookingForm({ ...bookingForm, customer_phone: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                                                placeholder="01xxxxxxxxx"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-white/40 mb-2 block">تاريخ الموعد</label>
                                            <input
                                                required
                                                type="datetime-local"
                                                value={bookingForm.booking_date}
                                                onChange={e => setBookingForm({ ...bookingForm, booking_date: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full py-5 bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white font-black rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        تأكيد طلب الحجز
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Product Order Modal */}
            <AnimatePresence>
                {isOrderOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOrderOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-xl bg-[#121216] border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
                        >
                            <div className="p-8 md:p-12">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h2 className="text-3xl font-black mb-2 text-white">طلب منتج</h2>
                                        <p className="text-white/40 text-sm">أنت تطلب: <span className="text-fuchsia-400 font-bold">{selectedProduct?.name}</span></p>
                                    </div>
                                    <button onClick={() => setIsOrderOpen(false)} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                                        <ArrowLeft size={24} />
                                    </button>
                                </div>
                                <form onSubmit={handleOrder} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-white/40 mb-2 block">الاسم</label>
                                                <input required type="text" value={orderForm.customer_name} onChange={e => setOrderForm({...orderForm, customer_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-cyan-500/50" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-white/40 mb-2 block">رقم الهاتف</label>
                                                <input required type="tel" value={orderForm.customer_phone} onChange={e => setOrderForm({...orderForm, customer_phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-cyan-500/50" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-white/40 mb-2 block">عنوان التوصيل</label>
                                            <input required type="text" value={orderForm.address} onChange={e => setOrderForm({...orderForm, address: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-cyan-500/50" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-white/40 mb-2 block">الكمية</label>
                                            <input required type="number" min="1" value={orderForm.quantity} onChange={e => setOrderForm({...orderForm, quantity: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-cyan-500/50" />
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full py-5 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white font-black rounded-2xl shadow-[0_0_30px_rgba(192,38,211,0.3)] hover:scale-[1.02] transition-all">تأكيد طلب الشراء</button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* AI Floating Assistant */}
            <div className="fixed bottom-8 right-8 z-[1000] flex flex-col items-end gap-4">
                <AnimatePresence>
                    {isAIChatOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.9 }}
                            className="w-[350px] bg-[#121216] border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.5)] mb-2"
                        >
                            <div className="p-6 border-b border-white/5 bg-gradient-to-r from-cyan-500/10 to-fuchsia-500/10 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center border border-white/5">
                                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping"></div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black">Will AI Assistant</h4>
                                        <p className="text-[10px] text-white/40">مساعدك الذكي من {salon.name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsAIChatOpen(false)} className="text-white/20 hover:text-white">
                                    <Clock size={16} className="rotate-45" />
                                </button>
                            </div>
                            
                            <div className="p-6 h-[250px] overflow-y-auto space-y-4">
                                {aiResponse ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 p-4 rounded-2xl text-xs leading-relaxed text-white/80 border border-white/5">
                                        {aiResponse}
                                    </motion.div>
                                ) : (
                                    <div className="text-center py-10">
                                        <p className="text-xs text-white/20">اسألني عن الخدمات، المواعيد، أو المنتجات المتاحة!</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-black/40 border-t border-white/5">
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={aiQuery}
                                        onChange={e => setAiQuery(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && askWillAI()}
                                        placeholder="اكتب سؤالك هنا..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs focus:outline-none focus:border-cyan-500/50 transition-all"
                                    />
                                    <button 
                                        onClick={askWillAI}
                                        disabled={isAiLoading}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center text-black hover:scale-105 transition-all"
                                    >
                                        {isAiLoading ? <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <ChevronRight size={16} />}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsAIChatOpen(!isAIChatOpen)}
                    className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-fuchsia-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.4)] border border-white/20 group"
                >
                    <div className="relative">
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0A0A0C]"></div>
                        <Star size={28} className={`text-white transition-transform duration-500 ${isAIChatOpen ? 'rotate-180' : ''}`} fill="currentColor" />
                    </div>
                </motion.button>
            </div>
        </div>
    );
};

export default SalonPublicPage;
