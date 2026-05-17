import React from 'react';
import { Users, Plus, Link, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { Lead } from '../../types/admin';

interface LeadsTabProps {
    leads: Lead[];
    setShowAddLeadModal: (show: boolean) => void;
    handleLeadStatusUpdate: (leadId: string, newStatus: 'accepted' | 'rejected') => void;
    handleDeleteLead: (id: string) => void;
}

const LeadsTab: React.FC<LeadsTabProps> = ({ leads, setShowAddLeadModal, handleLeadStatusUpdate, handleDeleteLead }) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <Users className="text-fuchsia-500" />
                    إدارة المهتمين
                </h2>
                <button onClick={() => setShowAddLeadModal(true)} className="px-6 py-2 bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-white font-bold rounded-xl flex items-center gap-2 hover:scale-105 transition-all">
                    <Plus size={18} /> إضافة متقدم يدوياً
                </button>
            </div>
            
            {/* Mobile View: Cards */}
            <div className="md:hidden space-y-4">
                {leads.map(lead => (
                    <div key={lead.id} className="bg-[#121214] border border-white/5 p-4 rounded-[24px] space-y-3">
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-base flex items-center gap-2">
                                {lead.name}
                                {lead.social_link && (
                                    <a href={lead.social_link} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-white transition-all">
                                        <Link size={14} />
                                    </a>
                                )}
                            </h3>
                            <span className={`px-2 py-1 rounded-lg text-[9px] font-bold ${lead.interest_type === 'salon' ? 'bg-fuchsia-500/10 text-fuchsia-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                                {lead.interest_type === 'salon' ? 'صالون' : (lead.interest_type === 'company' ? 'شركة' : 'مسوق')}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-white/40">الموبايل:</span>
                            <span className="font-mono text-cyan-400" dir="ltr">{lead.phone}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-white/40">الحالة:</span>
                            <span className={`font-bold ${lead.status === 'accepted' ? 'text-green-400' : (lead.status === 'rejected' ? 'text-red-400' : 'text-amber-400')}`}>
                                {lead.status === 'accepted' ? 'مقبول' : (lead.status === 'rejected' ? 'مرفوض' : 'قيد الانتظار')}
                            </span>
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-white/5 mt-2">
                            {lead.status === 'pending' && (
                                <>
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleLeadStatusUpdate(lead.id, 'accepted');
                                        }} 
                                        className="flex-1 bg-green-500/10 text-green-400 border border-green-500/20 py-3 rounded-xl text-xs font-bold hover:bg-green-500 hover:text-white transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={14} /> قبول
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleLeadStatusUpdate(lead.id, 'rejected');
                                        }} 
                                        className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 py-3 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                                    >
                                        <XCircle size={14} /> رفض
                                    </button>
                                </>
                            )}
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDeleteLead(lead.id);
                                }} 
                                className={`p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-lg flex items-center justify-center ${lead.status !== 'pending' ? 'w-full' : ''}`}
                                title="حذف نهائي"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
                {leads.length === 0 && <p className="text-center text-white/20 py-8">لا يوجد مهتمين حالياً</p>}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block bg-[#121214] border border-white/5 rounded-[32px] overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-white/5 border-b border-white/5">
                        <tr><th className="p-6">الاسم</th><th className="p-6">الموبايل</th><th className="p-6">النوع</th><th className="p-6">الروابط</th><th className="p-6">الحالة</th><th className="p-6">إجراء</th></tr>
                    </thead>
                    <tbody>
                        {leads.map(lead => (
                            <tr key={lead.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                <td className="p-6 font-bold">{lead.name}</td>
                                <td className="p-6 font-mono text-cyan-400" dir="ltr">{lead.phone}</td>
                                <td className="p-6"><span className={`px-2 py-1 rounded-lg text-[9px] font-bold ${lead.interest_type === 'salon' ? 'bg-fuchsia-500/10 text-fuchsia-400' : 'bg-cyan-500/10 text-cyan-400'}`}>{lead.interest_type === 'salon' ? 'صالون' : (lead.interest_type === 'company' ? 'شركة' : 'مسوق')}</span></td>
                                <td className="p-6">
                                    {lead.social_link ? (
                                        <a href={lead.social_link} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-white transition-all flex items-center gap-1 text-xs">
                                            <Link size={14} /> عرض الحساب
                                        </a>
                                    ) : <span className="text-white/20 text-xs">لا يوجد</span>}
                                </td>
                                <td className="p-6">
                                    <span className={`text-xs font-bold ${lead.status === 'accepted' ? 'text-green-400' : (lead.status === 'rejected' ? 'text-red-400' : 'text-amber-400')}`}>
                                        {lead.status === 'accepted' ? 'مقبول' : (lead.status === 'rejected' ? 'مرفوض' : 'قيد الانتظار')}
                                    </span>
                                </td>
                                <td className="p-6">
                                    <div className="flex gap-3">
                                        {(!lead.status || lead.status === 'pending') && (
                                            <>
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleLeadStatusUpdate(lead.id, 'accepted');
                                                    }} 
                                                    className="p-3 bg-green-500/10 text-green-400 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-sm flex items-center justify-center" 
                                                    title="قبول وإرسال رابط التسجيل"
                                                >
                                                    <CheckCircle size={20} />
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleLeadStatusUpdate(lead.id, 'rejected');
                                                    }} 
                                                    className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center" 
                                                    title="رفض"
                                                >
                                                    <XCircle size={20} />
                                                </button>
                                            </>
                                        )}
                                        <button 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleDeleteLead(lead.id);
                                            }} 
                                            className="p-3 bg-red-600/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center justify-center cursor-pointer" 
                                            title="حذف نهائي"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeadsTab;
