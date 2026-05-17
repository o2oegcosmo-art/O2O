import React from 'react';
import { DollarSign, CheckCircle, XCircle, Link } from 'lucide-react';
import { PaymentRequest } from '../../types/admin';

interface PaymentsTabProps {
    payments: PaymentRequest[];
    handleVerifyPayment: (id: string, status: 'approved' | 'rejected') => void;
}

const PaymentsTab: React.FC<PaymentsTabProps> = ({ payments, handleVerifyPayment }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
                <DollarSign className="text-amber-400" />
                طلبات الدفع المعلقة والتحصيل
            </h2>
            <div className="bg-[#121214] border border-white/5 rounded-[32px] overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-white/5 border-b border-white/5">
                        <tr><th className="p-6">الصالون</th><th className="p-6">القيمة</th><th className="p-6">الخطة</th><th className="p-6">التاريخ</th><th className="p-6">الإيصال</th><th className="p-6">إجراء</th></tr>
                    </thead>
                    <tbody>
                        {payments.length === 0 ? (
                            <tr><td colSpan={6} className="p-20 text-center text-white/20">لا يوجد طلبات دفع معلقة حالياً</td></tr>
                        ) : payments.map(payment => (
                            <tr key={payment.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                <td className="p-6 font-bold">{payment.tenant?.name}</td>
                                <td className="p-6 text-green-400 font-mono font-bold">{payment.amount.toLocaleString()} ج.م</td>
                                <td className="p-6 text-xs text-white/40">{payment.subscription?.plan?.name || 'تجديد باقة'}</td>
                                <td className="p-6 text-xs text-white/40">{new Date(payment.created_at).toLocaleDateString('ar-EG')}</td>
                                <td className="p-6">
                                    {payment.receipt_path ? (
                                        <a href={`http://localhost:8000/storage/${payment.receipt_path}`} target="_blank" rel="noreferrer" className="text-cyan-400 flex items-center gap-2 hover:underline text-xs">
                                            <Link size={14} /> عرض الإيصال
                                        </a>
                                    ) : <span className="text-white/20 text-xs">لا يوجد</span>}
                                </td>
                                <td className="p-6">
                                    <div className="flex gap-2">
                                        <button onClick={() => handleVerifyPayment(payment.id, 'approved')} className="px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl text-[10px] font-bold hover:bg-green-500 hover:text-white transition-all flex items-center gap-1"><CheckCircle size={14} /> تأكيد وتفعيل</button>
                                        <button onClick={() => handleVerifyPayment(payment.id, 'rejected')} className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-[10px] font-bold hover:bg-red-500 hover:text-white transition-all flex items-center gap-1"><XCircle size={14} /> رفض</button>
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

export default PaymentsTab;
