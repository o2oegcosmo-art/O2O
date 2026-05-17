import React from 'react';
import toast from 'react-hot-toast';
import AdContainer from '../AdContainer';
import { Customer, Service } from '../../types/salon';

interface OverviewTabProps {
    data: any;
    setShowBookingModal: (val: boolean) => void;
    calculateRevenue: () => any;
    customers: Customer[];
    bookings: any[];
    weeklyStats: number[];
    maxStats: number;
    updateBookingStatus: (id: string, status: string) => void;
    setCompletingBooking: (booking: any) => void;
    setFinalPrice: (price: string) => void;
    setActiveTab: (tab: any) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
    data,
    setShowBookingModal,
    calculateRevenue,
    customers,
    bookings,
    weeklyStats,
    maxStats,
    updateBookingStatus,
    setCompletingBooking,
    setFinalPrice,
    setActiveTab
}) => {
    return (
        <>
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 overflow-hidden">
                <div className="w-full">
                    <h1 className="text-xl md:text-3xl font-black text-white mb-2 leading-tight">لوحة تحكم مركز الجمال بالذكاء الاصطناعي</h1>
                    <p className="text-sm md:text-lg text-white/60">مرحباً {data?.user?.name?.split(' ')[0] || 'بك'}، إليك ملخص الأداء لليوم</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <button onClick={() => setShowBookingModal(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold text-xs md:text-sm shadow-lg shadow-violet-600/20 active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-sm">add</span>
                        حجز داخلي
                    </button>
                    <button 
                        onClick={() => {
                            const url = `${window.location.origin}/salon/${data?.tenant?.id}`;
                            navigator.clipboard.writeText(url);
                            toast.success('تم نسخ رابط المتجر لمشاركته مع العملاء!');
                        }}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold text-xs md:text-sm hover:bg-cyan-500/20 transition-all"
                    >
                        <span className="material-symbols-outlined text-sm">content_copy</span>
                        نسخ الرابط
                    </button>
                    <button 
                        onClick={() => window.open(`/salon/${data?.tenant?.id}`, '_blank')}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs md:text-sm hover:bg-white/10 transition-all"
                    >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                        فتح المتجر
                    </button>
                </div>
            </header>

            <AdContainer showAds={data?.tenant?.settings?.show_ads !== false} />

            {/* Bento Grid (Optimized for Mobile) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
                {/* Stat Card: Revenue */}
                <div className="md:col-span-4 bg-gradient-to-br from-violet-600/20 to-violet-900/10 backdrop-blur-xl rounded-3xl p-6 border border-violet-500/20 group hover:border-violet-500/40 transition-all shadow-xl">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl">payments</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Total Revenue</p>
                        <h3 className="text-3xl font-black text-white">{calculateRevenue().total.toLocaleString('ar-EG')} <span className="text-sm font-normal text-white/40">ج.م</span></h3>
                    </div>
                </div>

                {/* Stat Card: AI Leads */}
                <div className="md:col-span-4 bg-gradient-to-br from-cyan-600/20 to-cyan-900/10 backdrop-blur-xl rounded-3xl p-6 border border-cyan-500/20 group hover:border-cyan-500/40 transition-all shadow-xl">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl">psychology</span>
                        </div>
                        <div className="bg-cyan-400/20 px-3 py-1 rounded-full flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
                            <span className="text-[8px] font-black text-cyan-400 uppercase">Live AI</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Total Customers</p>
                        <h3 className="text-3xl font-black text-white">{customers.length}</h3>
                    </div>
                </div>

                {/* Stat Card: Bookings */}
                <div className="md:col-span-4 bg-gradient-to-br from-pink-600/20 to-pink-900/10 backdrop-blur-xl rounded-3xl p-6 border border-pink-500/20 group hover:border-pink-500/40 transition-all shadow-xl">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl">calendar_today</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Active Bookings</p>
                        <h3 className="text-3xl font-black text-white">{bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length}</h3>
                    </div>
                </div>

                {/* Large Chart Card */}
                <div className="md:col-span-8 glass rounded-xl p-6 min-h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-white">تحليلات النمو الذكي</h3>
                            <p className="text-sm text-white/40">مقارنة بين توقعات AI والأداء الفعلي</p>
                        </div>
                    </div>
                    <div className="flex-grow flex items-end gap-3 px-2 h-48">
                        {weeklyStats.map((count, idx) => {
                            const height = (count / maxStats) * 100;
                            const isPeak = count === Math.max(...weeklyStats) && count > 0;
                            return (
                                <div key={idx} 
                                    style={{ height: `${Math.max(height, 5)}%` }}
                                    className={`flex-1 bg-gradient-to-t ${isPeak ? 'from-cyan-500/40 to-cyan-500/60 ai-pulse' : 'from-violet-500/20 to-violet-500/40'} rounded-t-lg relative group transition-all duration-500`}
                                >
                                    {isPeak && (
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-cyan-400 text-black px-2 py-1 rounded text-[10px] font-bold shadow-lg shadow-cyan-400/40 whitespace-nowrap">الذروة الأسبوعية</div>
                                    )}
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-white/40 opacity-0 group-hover:opacity-100 transition-opacity font-bold">{count}</div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-between mt-4 text-[10px] text-white/40 font-bold px-2">
                        <span>الأحد</span><span>الاثنين</span><span>الثلاثاء</span><span>الأربعاء</span><span>الخميس</span><span>الجمعة</span><span>السبت</span>
                    </div>
                </div>

                {/* Recent Bookings List */}
                <div className="md:col-span-4 glass rounded-xl p-6 flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-6">الحجوزات القادمة اليوم</h3>
                    <div className="space-y-4 overflow-y-auto max-h-[320px] pr-2 custom-scrollbar">
                        {bookings.filter(b => new Date(b.appointment_at).toDateString() === new Date().toDateString()).map(booking => (
                            <div key={booking.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-violet-500/30 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold">
                                        {booking.customer.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white leading-tight">{booking.customer.name}</p>
                                        <p className="text-[10px] text-white/40 leading-tight mt-1">{booking.service.name}</p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                    <p className="text-[10px] font-bold text-violet-400 mb-1">{new Date(booking.appointment_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                                    <div className="flex gap-1">
                                        {booking.status === 'pending' && (
                                            <button 
                                                onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                                className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-[9px] font-bold hover:bg-green-500/20"
                                            >
                                                تأكيد
                                            </button>
                                        )}
                                        {(booking.status === 'confirmed' || booking.status === 'pending') && (
                                            <button 
                                                onClick={() => {
                                                    setCompletingBooking(booking);
                                                    setFinalPrice(booking.price.toString());
                                                }}
                                                className="px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded text-[9px] font-bold hover:bg-cyan-500/20"
                                            >
                                                إتمام
                                            </button>
                                        )}
                                        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                            <button 
                                                onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                                className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-[9px] font-bold hover:bg-red-500/20"
                                            >
                                                إلغاء
                                            </button>
                                        )}
                                        {booking.status === 'completed' && (
                                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">مكتمل</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {bookings.filter(b => new Date(b.appointment_at).toDateString() === new Date().toDateString()).length === 0 && (
                            <div className="text-center text-white/40 text-sm py-8">لا يوجد حجوزات لليوم.</div>
                        )}
                    </div>
                    <button onClick={() => setActiveTab('calendar')} className="w-full mt-auto pt-4 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors">عرض جميع المواعيد</button>
                </div>

                {/* Featured AI Card */}
                <div className="md:col-span-12 glass rounded-xl p-6 bg-gradient-to-br from-violet-600/10 to-transparent border-violet-500/20 relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 blur-[80px] -z-10"></div>
                    <div className="md:w-2/3">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-cyan-400 text-black px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">Will AI Assistant</div>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">احصل على استشارات ذكية لنمو صالونك</h2>
                        <p className="text-sm text-white/60 mb-6 max-w-2xl">
                            مستشارك الذكي المدعوم بـ Google Gemini يحلل بيانات عملائك ويقترح لك عروض تسويقية وأفكار لزيادة أرباحك بناءً على سلوك عملائك.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setActiveTab('ai')} className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all text-sm shadow-lg">التحدث مع المستشار</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OverviewTab;
