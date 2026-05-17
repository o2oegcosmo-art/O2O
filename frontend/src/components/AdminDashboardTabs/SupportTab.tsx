import React from 'react';
import { Info, MessageSquare } from 'lucide-react';
import { SupportTicket } from '../../types/admin';

interface SupportTabProps {
    supportTickets: SupportTicket[];
    setSelectedTicket: (ticket: any) => void;
    setShowTicketModal: (show: boolean) => void;
}

const SupportTab: React.FC<SupportTabProps> = ({ supportTickets, setSelectedTicket, setShowTicketModal }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
                <Info className="text-blue-400" />
                مركز الدعم الفني
            </h2>
            <div className="grid grid-cols-1 gap-4">
                {supportTickets.length === 0 ? (
                    <div className="p-20 bg-[#121214] rounded-[40px] border border-white/5 text-center">
                        <p className="text-white/20">لا يوجد تذاكر دعم فني حالياً</p>
                    </div>
                ) : supportTickets.map(ticket => (
                    <div key={ticket.id} className="bg-[#121214] p-6 rounded-[32px] border border-white/5 flex justify-between items-center group hover:border-blue-500/30 transition-all">
                        <div className="flex gap-4 items-center">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${ticket.priority === 'high' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                <MessageSquare size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold">{ticket.subject}</h4>
                                <p className="text-xs text-white/40">الصالون: {ticket.salon} | التاريخ: {new Date(ticket.date).toLocaleDateString('ar-EG')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                                ticket.status === 'resolved' ? 'bg-green-500/10 text-green-400' : 
                                ticket.status === 'open' ? 'bg-blue-500/10 text-blue-400' : 
                                'bg-amber-500/10 text-amber-400'
                            }`}>
                                {ticket.status === 'resolved' ? 'تم الحل' : ticket.status === 'open' ? 'قيد المعالجة' : 'في الانتظار'}
                            </span>
                            <button 
                                onClick={() => { setSelectedTicket(ticket); setShowTicketModal(true); }}
                                className="px-6 py-2 bg-white/5 text-white text-[10px] font-bold rounded-xl border border-white/10 hover:bg-white/10 transition-all"
                            >
                                عرض والرد
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SupportTab;
