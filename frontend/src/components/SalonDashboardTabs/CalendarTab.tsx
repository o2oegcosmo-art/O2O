import React from 'react';
import { ChevronRight, ChevronLeft, Clock } from 'lucide-react';

interface CalendarTabProps {
    prevWeek: () => void;
    nextWeek: () => void;
    weekDays: Date[];
    setShowBookingModal: (val: boolean) => void;
    bookings: any[];
    updateBookingStatus: (id: string, status: string) => void;
    setCompletingBooking: (booking: any) => void;
    setFinalPrice: (price: string) => void;
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
}

const CalendarTab: React.FC<CalendarTabProps> = ({
    prevWeek,
    nextWeek,
    weekDays,
    setShowBookingModal,
    bookings,
    updateBookingStatus,
    setCompletingBooking,
    setFinalPrice,
    currentDate,
    setCurrentDate
}) => {
    return (
        <section>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-white">تقويم الحجوزات</h2>
                    <div className="flex items-center gap-4 mt-3">
                        <button onClick={prevWeek} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"><ChevronRight size={20} /></button>
                        <span className="font-bold text-sm md:text-base">{weekDays[0].toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}</span>
                        <button onClick={nextWeek} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"><ChevronLeft size={20} /></button>
                    </div>
                </div>
                <button className="w-full md:w-auto bg-gradient-to-r from-violet-600 to-pink-600 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-violet-600/20 active:scale-95 transition-all flex items-center justify-center gap-2" onClick={() => setShowBookingModal(true)}>
                    <span className="material-symbols-outlined">add</span>
                    إضافة حجز
                </button>
            </div>

            {/* Desktop View (Grid) */}
            <div className="hidden md:grid grid-cols-7 gap-4 min-h-[600px]">
                {weekDays.map((day, idx) => {
                    const isToday = day.toDateString() === new Date().toDateString();
                    const dayBookings = bookings.filter(b => new Date(b.appointment_at).toDateString() === day.toDateString());

                    return (
                        <div key={idx} className={`bg-slate-900/50 backdrop-blur-xl rounded-2xl overflow-hidden flex flex-col border ${isToday ? 'border-violet-500 bg-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.15)]' : 'border-white/5'}`}>
                            <div className="bg-white/5 p-4 text-center border-b border-white/5">
                                <div className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">{day.toLocaleDateString('ar-EG', { weekday: 'short' })}</div>
                                <div className="text-2xl font-black text-white">{day.getDate()}</div>
                            </div>
                            <div className="p-3 flex flex-col gap-3 flex-1 overflow-y-auto custom-scrollbar">
                                {dayBookings.length > 0 ? dayBookings.map(b => (
                                    <div key={b.id} className="bg-gradient-to-br from-violet-600/20 to-pink-600/20 p-3 rounded-xl border border-violet-500/20 hover:border-violet-500/40 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="text-[10px] font-black text-violet-300 flex items-center gap-1"><Clock size={10}/> {new Date(b.appointment_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                                            <div className="flex gap-1">
                                                {b.status === 'pending' && <button onClick={() => updateBookingStatus(b.id, 'confirmed')} className="text-[8px] bg-green-500/20 text-green-400 px-1 rounded font-bold">تأكيد</button>}
                                                {(b.status === 'pending' || b.status === 'confirmed') && <button onClick={() => { setCompletingBooking(b); setFinalPrice(b.price.toString()); }} className="text-[8px] bg-cyan-500/20 text-cyan-400 px-1 rounded font-bold">تم</button>}
                                                {b.status === 'completed' && <span className="text-[7px] text-emerald-400 font-bold">مكتمل</span>}
                                            </div>
                                        </div>
                                        <div className="font-bold text-xs truncate text-white">{b.customer.name}</div>
                                        <div className="text-[9px] text-white/40 truncate mt-1">{b.service.name} • <span className="text-violet-300">{b.staff ? b.staff.name : 'بدون موظف'}</span></div>
                                    </div>
                                )) : <div className="text-center text-white/10 text-[10px] mt-4 font-bold uppercase tracking-tighter italic">No Bookings</div>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Mobile View (Day Picker + List) */}
            <div className="md:hidden flex flex-col gap-6">
                <div className="flex gap-3 overflow-x-auto pb-4 px-1 custom-scrollbar scroll-smooth">
                    {weekDays.map((day, idx) => {
                        const isToday = day.toDateString() === new Date().toDateString();
                        const isSelected = day.toDateString() === currentDate.toDateString();
                        return (
                            <button 
                                key={idx} 
                                onClick={() => setCurrentDate(new Date(day))}
                                className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border ${isSelected ? 'bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-600/30' : 'bg-slate-900/50 text-white/40 border-white/5'}`}
                            >
                                <span className="text-[10px] font-black uppercase mb-1">{day.toLocaleDateString('ar-EG', { weekday: 'short' })}</span>
                                <span className="text-xl font-black">{day.getDate()}</span>
                                {isToday && !isSelected && <div className="w-1.5 h-1.5 bg-violet-500 rounded-full mt-1"></div>}
                            </button>
                        );
                    })}
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold text-white/60 text-sm px-1">حجوزات يوم {currentDate.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}</h3>
                    {bookings.filter(b => new Date(b.appointment_at).toDateString() === currentDate.toDateString()).length > 0 ? (
                        bookings.filter(b => new Date(b.appointment_at).toDateString() === currentDate.toDateString()).map(b => (
                            <div key={b.id} className="bg-slate-900/50 backdrop-blur-xl p-5 rounded-[2rem] border border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-violet-600/20 flex flex-col items-center justify-center text-violet-400">
                                        <span className="text-[10px] font-black">{new Date(b.appointment_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }).split(' ')[0]}</span>
                                        <span className="text-[8px] font-black uppercase">{new Date(b.appointment_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }).split(' ')[1]}</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">{b.customer.name}</h4>
                                        <p className="text-xs text-white/40">{b.service.name} • <span className="text-violet-300">{b.staff ? b.staff.name : 'بدون موظف'}</span></p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {b.status === 'pending' && (
                                        <button 
                                            onClick={() => updateBookingStatus(b.id, 'confirmed')}
                                            className="bg-green-500/10 text-green-400 px-4 py-2 rounded-xl text-xs font-bold"
                                        >
                                            تأكيد
                                        </button>
                                    )}
                                    {(b.status === 'confirmed' || b.status === 'pending') && (
                                        <button 
                                            onClick={() => {
                                                setCompletingBooking(b);
                                                setFinalPrice(b.price.toString());
                                            }}
                                            className="bg-cyan-500/10 text-cyan-400 px-4 py-2 rounded-xl text-xs font-bold"
                                        >
                                            إتمام الخدمة
                                        </button>
                                    )}
                                    {b.status !== 'cancelled' && b.status !== 'completed' && (
                                        <button 
                                            onClick={() => updateBookingStatus(b.id, 'cancelled')}
                                            className="bg-red-500/10 text-red-400 px-4 py-2 rounded-xl text-xs font-bold"
                                        >
                                            إلغاء
                                        </button>
                                    )}
                                    {b.status === 'completed' && (
                                        <span className="text-emerald-400 font-bold text-xs bg-emerald-500/10 px-3 py-1 rounded-lg">مكتمل</span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 bg-white/5 rounded-[2rem] border border-white/5 text-center text-white/20 italic">لا يوجد حجوزات لهذا اليوم.</div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default CalendarTab;
