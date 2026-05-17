import { useState, useEffect } from 'react';
import api from '../api/config';
import { BarChart3, TrendingUp, DollarSign, PieChart, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function ReportsTab() {
    const [reports, setReports] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await api.get('/crm/reports');
            const data = res.data;
            
            // إذا كانت البيانات الحقيقية فارغة، استخدم البيانات التجريبية الغنية
            const hasRealData = (data.sales_chart && data.sales_chart.length > 0) ||
                                (data.summary?.total_revenue > 0);
            
            if (hasRealData) {
                setReports({
                    total_revenue: data.summary?.total_revenue || 0,
                    conversion_rate: data.summary?.conversion_rate || 0,
                    total_campaigns: data.summary?.total_campaigns || 0,
                    avg_deal_size: data.summary?.avg_deal_size || 0,
                    sales_chart: data.sales_chart || [],
                    client_distribution: data.client_distribution || [],
                    top_products: data.top_products || []
                });
            } else {
                setReports(null);
                setError('لا توجد بيانات كافية لعرض التقارير حالياً.');
            }
        } catch {
            setError('حدث خطأ أثناء جلب التقارير. يرجى المحاولة لاحقاً.');
            setReports(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-40 space-y-4">
            <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
            <p className="text-white/40 text-sm animate-pulse">جاري تحليل البيانات الاستراتيجية...</p>
        </div>
    );

    if (error || !reports) return (
        <div className="flex flex-col items-center justify-center py-40 space-y-4 text-center rtl" dir="rtl">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
                <BarChart3 size={32} />
            </div>
            <h3 className="text-xl font-bold text-white">التقارير غير متاحة</h3>
            <p className="text-white/50 max-w-sm">{error || 'لا توجد بيانات لعرضها في الوقت الحالي.'}</p>
        </div>
    );

    return (
        <div className="space-y-8 text-right rtl" dir="rtl">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">تحليلات الأداء والتقارير (Business Intelligence)</h2>
                    <p className="text-sm text-white/50">راقب نمو مبيعاتك وحلل سلوك الصالونات لاتخاذ قرارات مبنية على البيانات.</p>
                </div>
                <div className="flex gap-2">
                    <button className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] text-white flex items-center gap-2 hover:bg-white/10 transition-all">
                        <Calendar size={14} /> آخر 30 يوم
                    </button>
                    <button className="bg-cyan-500 text-black font-black rounded-xl px-4 py-2 text-[10px] hover:bg-cyan-400 transition-all">تصدير PDF</button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'إجمالي الإيرادات', value: (reports.total_revenue || 0).toLocaleString() + ' ج.م', growth: '+12%', color: 'text-cyan-400', icon: DollarSign },
                    { label: 'معدل التحويل', value: reports.conversion_rate + '%', growth: '+2.5%', color: 'text-fuchsia-400', icon: TrendingUp },
                    { label: 'إجمالي الحملات', value: reports.total_campaigns, growth: '+8%', color: 'text-amber-400', icon: BarChart3 },
                    { label: 'معدل الاحتفاظ', value: '92%', growth: '+1%', color: 'text-green-400', icon: PieChart },
                ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent -translate-x-12 -translate-y-12 rounded-full" />
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 bg-white/5 rounded-2xl ${stat.color}`}><stat.icon size={20} /></div>
                            <span className="text-[10px] text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded-full">{stat.growth}</span>
                        </div>
                        <p className="text-xs text-white/40 mb-1">{stat.label}</p>
                        <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Products Table */}
                <div className="bg-white/5 border border-white/10 rounded-[40px] p-8">
                    <h3 className="font-bold text-white mb-6 flex items-center gap-2">المنتجات الأكثر مبيعاً</h3>
                    <div className="space-y-4">
                        {reports.top_products.map((p: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 group hover:border-cyan-500/20 transition-all">
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-black text-white/20 w-4">{i+1}</span>
                                    <p className="text-sm font-bold text-white">{p.name}</p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-white">{p.sales} مبيعة</p>
                                        <p className={`text-[10px] flex items-center gap-0.5 ${p.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {p.change > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                            {Math.abs(p.change)}%
                                        </p>
                                    </div>
                                    <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-cyan-500" style={{ width: `${(p.sales/500)*100}%` }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Regional Analysis (Placeholder for Chart) */}
                <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 flex flex-col">
                    <h3 className="font-bold text-white mb-6">توزيع المبيعات حسب المنطقة</h3>
                    <div className="flex-1 flex items-center justify-center relative">
                        {/* Semi-circular chart UI */}
                        <div className="w-64 h-32 border-[20px] border-cyan-500/20 border-t-cyan-500 border-r-fuchsia-500 rounded-t-full relative">
                            <div className="absolute -bottom-4 left-0 right-0 text-center">
                                <p className="text-3xl font-black text-white">85%</p>
                                <p className="text-[10px] text-white/40 uppercase">كفاءة التغطية</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-cyan-500 rounded-full" />
                            <div className="text-right">
                                <p className="text-xs font-bold text-white">القاهرة الكبرى</p>
                                <p className="text-[10px] text-white/40">65% من المبيعات</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-fuchsia-500 rounded-full" />
                            <div className="text-right">
                                <p className="text-xs font-bold text-white">الدلتا والقناة</p>
                                <p className="text-[10px] text-white/40">25% من المبيعات</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
