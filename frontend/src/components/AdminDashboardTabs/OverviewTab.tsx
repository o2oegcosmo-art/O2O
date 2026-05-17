import React from 'react';
import { Clock, RotateCcw, TrendingUp, DollarSign, Calendar, ShoppingBag } from 'lucide-react';
import { Stats } from '../../types/admin';

interface OverviewTabProps {
    stats: Stats | null;
    fetchData: (silent?: boolean) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ stats, fetchData }) => {
    if (!stats) return null;

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <h2 className="text-3xl font-black tracking-tight">مؤشرات الأداء المركزية</h2>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] text-white/40 flex items-center gap-2">
                        <Clock size={14} /> آخر تحديث: {new Date().toLocaleTimeString('ar-EG')}
                    </div>
                    <button 
                        onClick={() => fetchData(false)} 
                        className="px-4 py-2 bg-fuchsia-600/10 text-fuchsia-400 border border-fuchsia-600/20 rounded-xl text-[10px] font-black hover:bg-fuchsia-600 hover:text-white transition-all flex items-center gap-2 group"
                    >
                        <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                        تحديث البيانات الآن
                    </button>
                </div>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'MRR المتوقع', value: (stats?.mrr ?? 0).toLocaleString() + ' ج.م', icon: TrendingUp, color: 'text-cyan-400' },
                    { label: 'إجمالي المبيعات', value: (stats?.totalRevenue ?? 0).toLocaleString() + ' ج.م', icon: DollarSign, color: 'text-fuchsia-400' },
                    { label: 'الصالونات النشطة', value: stats?.salonsCount ?? 0, icon: Calendar, color: 'text-amber-400' },
                    { label: 'الشركات المتعاقدة', value: stats?.companiesCount ?? 0, icon: ShoppingBag, color: 'text-green-400' },
                ].map((stat, i) => (
                    <div key={i} className="bg-[#121214] border border-white/5 p-6 rounded-[32px] hover:border-white/10 transition-all">
                        <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 ${stat.color}`}><stat.icon size={20} /></div>
                        <p className="text-xs text-white/40 mb-1">{stat.label}</p>
                        <h3 className="text-2xl font-black">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-[#121214] border border-white/5 p-8 rounded-[40px]">
                    <h3 className="font-bold mb-6 text-lg">نمو المهتمين (Leads Growth)</h3>
                    <div className="h-64 flex items-end justify-between gap-2">
                        {(stats?.growthData || []).map((h, i) => (
                            <div key={i} className="flex-1 bg-gradient-to-t from-fuchsia-600/20 to-fuchsia-500 rounded-t-lg opacity-60 hover:opacity-100 transition-all" style={{ height: `${h}%` }}></div>
                        ))}
                    </div>
                </div>
                <div className="bg-gradient-to-br from-fuchsia-600/10 to-cyan-600/10 border border-white/10 p-8 rounded-[40px] flex flex-col justify-center text-center">
                    <h3 className="text-xl font-bold mb-4">Command Center v2.0</h3>
                    <p className="text-sm text-white/50 leading-relaxed">أهلاً بك يا سيادة القائد. تم تفعيل كافة الصلاحيات وأنظمة المراقبة الذكية بنجاح.</p>
                    <button className="mt-8 bg-white text-black font-black py-4 rounded-2xl hover:scale-105 transition-transform active:scale-95 shadow-xl">تصدير التقرير</button>
                </div>
            </div>
        </div>
    );
};

export default OverviewTab;
