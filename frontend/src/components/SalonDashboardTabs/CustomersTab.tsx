import React from 'react';
import { Customer } from '../../types/salon';

interface CustomersTabProps {
    setShowCustomerModal: (val: boolean) => void;
    customers: Customer[];
    setEditingCustomer: (customer: Customer | null) => void;
    setCustomerForm: (form: any) => void;
    handleCustomerDelete: (id: string) => void;
}

const CustomersTab: React.FC<CustomersTabProps> = ({
    setShowCustomerModal,
    customers,
    setEditingCustomer,
    setCustomerForm,
    handleCustomerDelete
}) => {
    return (
        <section>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold">إدارة العملاء</h2>
                <button 
                    onClick={() => setShowCustomerModal(true)}
                    className="bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold px-6 py-3 rounded-xl hover:scale-105 transition-all shadow-lg shadow-violet-600/20"
                >
                    + إضافة عميل يدوياً
                </button>
            </div>
            <div className="hidden lg:block glass rounded-xl overflow-hidden">
                <table className="w-full text-right">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                            <th className="p-4 font-bold text-white/60">الاسم</th>
                            <th className="p-4 font-bold text-white/60">رقم الهاتف</th>
                            <th className="p-4 font-bold text-white/60">التصنيف</th>
                            <th className="p-4 font-bold text-white/60">عدد الحجوزات</th>
                            <th className="p-4 font-bold text-white/60">تاريخ الانضمام</th>
                            <th className="p-4 font-bold text-white/60">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.length > 0 ? customers.map(customer => (
                            <tr key={customer.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="p-4 font-bold">{customer.name}</td>
                                <td className="p-4 text-white/60">{customer.phone}</td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                                        customer.category === 'VIP' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
                                        customer.category === 'عميل دائم' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                        customer.category === 'عميل متوقف' ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30' :
                                        'bg-green-500/20 text-green-400 border border-green-500/30'
                                    }`}>
                                        {customer.category || 'جديد'}
                                    </span>
                                </td>
                                <td className="p-4"><span className="bg-violet-500/20 text-violet-300 px-3 py-1 rounded-full text-xs">{customer.bookings_count || 0} حجوزات</span></td>
                                <td className="p-4 text-white/60 text-sm">{new Date(customer.created_at).toLocaleDateString('ar-EG')}</td>
                                <td className="p-4 flex gap-3">
                                    <button 
                                        onClick={() => {
                                            setEditingCustomer(customer);
                                            setCustomerForm({ name: customer.name, phone: customer.phone, category: customer.category || 'جديد' });
                                            setShowCustomerModal(true);
                                        }}
                                        className="text-violet-400 hover:text-violet-300"
                                    >
                                        تعديل
                                    </button>
                                    <button 
                                        onClick={() => handleCustomerDelete(customer.id)}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        حذف
                                    </button>
                                </td>
                            </tr>
                        )) : <tr><td colSpan={6} className="p-8 text-center text-white/40">لا يوجد عملاء بعد.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View (Customers) */}
            <div className="lg:hidden space-y-4">
                {customers.length > 0 ? customers.map(customer => (
                    <div key={customer.id} className="glass p-5 rounded-2xl border border-white/5 flex flex-col gap-4 relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-cyan-400 font-bold">
                                    {customer.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{customer.name}</h3>
                                    <p className="text-[10px] text-white/40">{customer.phone}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                customer.category === 'VIP' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
                                customer.category === 'عميل دائم' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                'bg-green-500/20 text-green-400 border border-green-500/30'
                            }`}>
                                {customer.category || 'جديد'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs border-y border-white/5 py-3">
                            <div className="flex flex-col gap-1">
                                <span className="text-white/30 text-[9px] uppercase font-bold tracking-wider">عدد الحجوزات</span>
                                <span className="text-white font-bold">{customer.bookings_count || 0}</span>
                            </div>
                            <div className="flex flex-col gap-1 text-right">
                                <span className="text-white/30 text-[9px] uppercase font-bold tracking-wider">تاريخ الانضمام</span>
                                <span className="text-white/60">{new Date(customer.created_at).toLocaleDateString('ar-EG')}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => {
                                    setEditingCustomer(customer);
                                    setCustomerForm({ name: customer.name, phone: customer.phone, category: customer.category || 'جديد' });
                                    setShowCustomerModal(true);
                                }}
                                className="flex-1 py-3 bg-white/5 rounded-xl text-[10px] font-bold text-white hover:bg-white/10 transition-all"
                            >
                                تعديل
                            </button>
                            <button 
                                onClick={() => handleCustomerDelete(customer.id)}
                                className="flex-1 py-3 bg-red-500/10 rounded-xl text-[10px] font-bold text-red-400 hover:bg-red-500/20 transition-all"
                            >
                                حذف العميل
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="p-12 text-center text-white/20 italic">لا يوجد عملاء حالياً.</div>
                )}
            </div>
        </section>
    );
};

export default CustomersTab;
