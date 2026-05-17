import React from 'react';
import { Clock } from 'lucide-react';
import { Staff } from '../../types/salon';

interface StaffTabProps {
    staff: Staff[];
    setEditingStaff: (staff: Staff | null) => void;
    setStaffForm: (form: any) => void;
    setShowStaffModal: (val: boolean) => void;
    toggleStaffStatus: (staff: Staff) => void;
    openWorkingHours: (staff: Staff) => void;
}

const StaffTab: React.FC<StaffTabProps> = ({
    staff,
    setEditingStaff,
    setStaffForm,
    setShowStaffModal,
    toggleStaffStatus,
    openWorkingHours
}) => {
    return (
        <section>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold">إدارة الموظفين</h2>
                <button className="bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold px-6 py-3 rounded-xl hover:scale-105 transition-all" onClick={() => { setEditingStaff(null); setStaffForm({ name: '', specialization: '', is_active: true }); setShowStaffModal(true); }}>
                    + إضافة موظف
                </button>
            </div>
            <div className="hidden lg:block glass rounded-xl overflow-hidden">
                <table className="w-full text-right">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                            <th className="p-4 font-bold text-white/60">الاسم</th>
                            <th className="p-4 font-bold text-white/60">التخصص</th>
                            <th className="p-4 font-bold text-white/60">الحالة</th>
                            <th className="p-4 font-bold text-white/60">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staff.length > 0 ? staff.map(s => (
                            <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="p-4 font-bold">{s.name}</td>
                                <td className="p-4 text-white/60">{s.specialization}</td>
                                <td className="p-4">
                                    <span onClick={() => toggleStaffStatus(s)} className={`px-3 py-1 rounded-full text-xs cursor-pointer ${s.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {s.is_active ? 'نشط' : 'متوقف'}
                                    </span>
                                </td>
                                <td className="p-4 flex gap-3">
                                    <button onClick={() => { setEditingStaff(s); setStaffForm({ name: s.name, specialization: s.specialization, is_active: s.is_active }); setShowStaffModal(true); }} className="text-violet-400 text-sm hover:text-violet-300">تعديل</button>
                                    <button onClick={() => openWorkingHours(s)} className="text-cyan-400 text-sm hover:text-cyan-300 flex items-center gap-1"><Clock size={14} />ساعات العمل</button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={4} className="p-8 text-center text-white/40">لا يوجد موظفين مضافين بعد.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View (Staff) */}
            <div className="lg:hidden space-y-4">
                {staff.length > 0 ? staff.map(s => (
                    <div key={s.id} className="glass p-5 rounded-2xl border border-white/5 flex flex-col gap-4 relative overflow-hidden">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-400 font-black text-xl">
                                {s.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white text-lg">{s.name}</h3>
                                <p className="text-xs text-white/40">{s.specialization}</p>
                            </div>
                            <span onClick={() => toggleStaffStatus(s)} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest cursor-pointer ${s.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {s.is_active ? 'Active' : 'Offline'}
                            </span>
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-white/5">
                            <button onClick={() => { setEditingStaff(s); setStaffForm({ name: s.name, specialization: s.specialization, is_active: s.is_active }); setShowStaffModal(true); }} className="flex-1 py-2.5 bg-white/5 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all">تعديل البيانات</button>
                            <button onClick={() => openWorkingHours(s)} className="flex-1 py-2.5 bg-cyan-500/10 rounded-xl text-xs font-bold text-cyan-400 hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-2">
                                <Clock size={14} /> ساعات العمل
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="p-12 text-center text-white/20 italic">لا يوجد موظفين مضافين بعد.</div>
                )}
            </div>
        </section>
    );
};

export default StaffTab;
