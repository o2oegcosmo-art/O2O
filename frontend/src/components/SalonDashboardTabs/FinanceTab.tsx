import React from 'react';
import { Plus, TrendingUp, Banknote, PieChart, Trash2 } from 'lucide-react';
import { FinanceStats, Transaction, Expense } from '../../types/salon';

interface FinanceTabProps {
    setShowExpenseModal: (val: boolean) => void;
    financeStats: FinanceStats | null;
    transactions: Transaction[];
    expenses: Expense[];
    deleteExpense: (id: string) => void;
}

const FinanceTab: React.FC<FinanceTabProps> = ({
    setShowExpenseModal,
    financeStats,
    transactions,
    expenses,
    deleteExpense
}) => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500" dir="rtl">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white">النظام المالي</h2>
                    <p className="text-white/40">إدارة الإيرادات، المصروفات، وصافي الأرباح</p>
                </div>
                <button 
                    onClick={() => setShowExpenseModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
                >
                    <Plus size={20} /> تسجيل مصروفات
                </button>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-8 rounded-[32px] border border-white/10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center">
                            <TrendingUp size={24} />
                        </div>
                        {financeStats && (
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${financeStats.current_month.revenue >= financeStats.previous_month.revenue ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                {financeStats.current_month.revenue >= financeStats.previous_month.revenue ? '+' : ''}
                                {financeStats.previous_month.revenue > 0 ? (((financeStats.current_month.revenue - financeStats.previous_month.revenue) / financeStats.previous_month.revenue) * 100).toFixed(0) : 0}%
                            </span>
                        )}
                    </div>
                    <p className="text-white/40 text-sm mb-1">إجمالي الإيرادات ({financeStats?.month_name || 'الشهر الحالي'})</p>
                    <h3 className="text-3xl font-black text-white">{financeStats?.current_month.revenue.toLocaleString() || 0} <span className="text-sm font-normal text-white/40">ج.م</span></h3>
                </div>

                <div className="glass p-8 rounded-[32px] border border-white/10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center">
                            <Banknote size={24} />
                        </div>
                    </div>
                    <p className="text-white/40 text-sm mb-1">إجمالي المصروفات</p>
                    <h3 className="text-3xl font-black text-white">{financeStats?.current_month.expenses.toLocaleString() || 0} <span className="text-sm font-normal text-white/40">ج.م</span></h3>
                </div>

                <div className="glass p-8 rounded-[32px] border border-white/10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center">
                            <PieChart size={24} />
                        </div>
                    </div>
                    <p className="text-white/40 text-sm mb-1">صافي الربح</p>
                    <h3 className="text-3xl font-black text-emerald-400">{financeStats?.current_month.profit.toLocaleString() || 0} <span className="text-sm font-normal text-white/40">ج.م</span></h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Transactions */}
                <div className="lg:col-span-1 bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border border-white/5">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-white">آخر العمليات المالية</h3>
                    </div>
                    
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest">
                                <tr>
                                    <th className="p-4">البيان</th>
                                    <th className="p-4 text-center">النوع</th>
                                    <th className="p-4">المبلغ</th>
                                    <th className="p-4">التاريخ</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {transactions.map((tr, i) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-bold text-white">{tr.description}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${tr.type === 'revenue' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {tr.type === 'revenue' ? 'Income' : 'Expense'}
                                            </span>
                                        </td>
                                        <td className={`p-4 font-mono font-bold ${tr.type === 'revenue' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {tr.type === 'revenue' ? '+' : '-'}{Number(tr.amount).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-white/40">{new Date(tr.date).toLocaleDateString('ar-EG')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card List */}
                    <div className="md:hidden p-4 space-y-3">
                        {transactions.map((tr, i) => (
                            <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                                <div className="flex flex-col gap-1">
                                    <span className="text-white font-bold text-sm">{tr.description}</span>
                                    <span className="text-white/40 text-[10px]">{new Date(tr.date).toLocaleDateString('ar-EG')}</span>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                    <span className={`font-mono font-black ${tr.type === 'revenue' ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {tr.type === 'revenue' ? '+' : '-'}{Number(tr.amount).toLocaleString()}
                                    </span>
                                    <span className={`text-[8px] font-black uppercase tracking-widest ${tr.type === 'revenue' ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {tr.type === 'revenue' ? 'Income' : 'Expense'}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {transactions.length === 0 && (
                            <div className="p-10 text-center text-white/20 italic">لا توجد عمليات مسجلة حالياً</div>
                        )}
                    </div>
                </div>

                {/* Expenses List */}
                <div className="glass rounded-[40px] overflow-hidden border border-white/10">
                    <div className="p-8 border-b border-white/10">
                        <h3 className="font-bold text-lg text-white">سجل المصروفات</h3>
                    </div>
                    <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                        {expenses.map((exp) => (
                            <div key={exp.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center group">
                                <div className="flex gap-4 items-center">
                                    <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
                                        <Banknote size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-white">{exp.title}</h4>
                                        <p className="text-[10px] text-white/40">{exp.category} | {new Date(exp.expense_date).toLocaleDateString('ar-EG')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-red-400">-{exp.amount} ج.م</span>
                                    <button onClick={() => deleteExpense(exp.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {expenses.length === 0 && (
                            <div className="p-10 text-center text-white/20 italic">لم يتم تسجيل أي مصروفات بعد</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinanceTab;
