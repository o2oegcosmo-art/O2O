import React from 'react';
import { toast } from 'react-hot-toast';
import { DashboardData, Plan } from '../../types/salon';

interface BillingTabProps {
    data: DashboardData | null;
    plans: Plan[];
    setSelectedPlan: (plan: Plan) => void;
    setShowPaymentModal: (show: boolean) => void;
}

const BillingTab: React.FC<BillingTabProps> = ({ data, plans, setSelectedPlan, setShowPaymentModal }) => {
    return (
        <section>
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-black text-white">الاشتراك والفوترة</h2>
                    <p className="text-slate-400 mt-2">إدارة باقة الاشتراك الحالية والترقية للوصول لميزات AI المتقدمة</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-emerald-400 font-bold text-sm">الباقة الحالية: {data?.tenant?.plan?.name || 'تجريبية'}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan: Plan) => (
                    <div key={plan.id} className={`glass rounded-[2.5rem] p-8 border ${plan.slug !== 'free' ? 'border-violet-500/30 bg-violet-500/5' : 'border-white/10'} flex flex-col relative overflow-hidden`}>
                        {plan.slug !== 'free' && (
                            <div className="absolute top-0 right-0 bg-violet-600 text-white text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest">موصى به</div>
                        )}
                        <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-4xl font-black">{plan.price}</span>
                            <span className="text-slate-500 text-xs">ج.م / شهرياً</span>
                        </div>
                        <ul className="space-y-4 mb-10 flex-grow">
                            {plan.features && Object.entries(plan.features).map(([key, val]: any) => (
                                <li key={key} className="flex items-center gap-3 text-sm text-slate-300">
                                    <span className={`material-symbols-outlined text-sm ${val ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {val ? 'check_circle' : 'cancel'}
                                    </span>
                                    {key}
                                </li>
                            ))}
                        </ul>
                        <button 
                            onClick={() => {
                                if (plan.slug === 'free') {
                                    toast.success('أنت بالفعل مشترك في الخطة الأساسية');
                                } else {
                                    setSelectedPlan(plan);
                                    setShowPaymentModal(true);
                                }
                            }}
                            className={`w-full py-4 rounded-2xl font-bold transition-all ${
                                plan.slug === 'free' 
                                ? 'bg-white/5 text-white/40 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg shadow-violet-600/30 hover:scale-105 active:scale-95'
                            }`}
                        >
                            {plan.slug === 'free' ? 'باقتك الحالية' : 'ترقية الآن'}
                        </button>
                    </div>
                ))}
            </div>

            {/* Payment History */}
            <div className="mt-12 glass rounded-[2.5rem] overflow-hidden border border-white/10">
                <div className="p-8 border-b border-white/10">
                    <h3 className="text-xl font-bold">سجل الفواتير</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="p-6 text-slate-400 text-xs font-bold uppercase">رقم الفاتورة</th>
                                <th className="p-6 text-slate-400 text-xs font-bold uppercase">الباقة</th>
                                <th className="p-6 text-slate-400 text-xs font-bold uppercase">المبلغ</th>
                                <th className="p-6 text-slate-400 text-xs font-bold uppercase">التاريخ</th>
                                <th className="p-6 text-slate-400 text-xs font-bold uppercase">الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.payments?.map((payment: any) => (
                                <tr key={payment.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                                    <td className="p-6 font-mono text-sm">#{payment.id.toString().slice(-6)}</td>
                                    <td className="p-6 font-bold">{payment.plan_name}</td>
                                    <td className="p-6 font-bold text-violet-400">{payment.amount} ج.م</td>
                                    <td className="p-6 text-slate-400 text-sm">{new Date(payment.created_at).toLocaleDateString('ar-EG')}</td>
                                    <td className="p-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                                            payment.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : 
                                            payment.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : 
                                            'bg-red-500/10 text-red-400'
                                        }`}>
                                            {payment.status === 'approved' ? 'مدفوعة' : payment.status === 'pending' ? 'قيد المراجعة' : 'ملغاة'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {(!data?.payments || data.payments.length === 0) && (
                                <tr><td colSpan={5} className="p-12 text-center text-slate-500 italic">لا يوجد سجل مدفوعات حالياً.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};

export default BillingTab;
