import React from 'react';
import api from '../api/config';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
    pending:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    shipped:   'bg-violet-500/20 text-violet-400 border-violet-500/30',
    delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statusLabels: Record<string, string> = {
    pending:   'في الانتظار',
    confirmed: 'مؤكد',
    shipped:   'تم الشحن',
    delivered: 'تم التسليم',
    cancelled: 'ملغي',
};

export default function RetailOrdersTab({ tenantId }: { tenantId?: string }) {
    const [orders, setOrders] = React.useState<any[]>([]);
    const [stats, setStats]   = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [ordersRes, statsRes] = await Promise.all([
                api.get('/retail/orders'),
                api.get('/retail/orders/stats'),
            ]);
            setOrders(ordersRes.data.orders?.data || []);
            setStats(statsRes.data.stats);
        } catch (err) {
            console.error('فشل تحميل طلبات المتجر', err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId: string, status: string) => {
        try {
            await api.patch(`/retail/orders/${orderId}/status`, { status });
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
            toast.success('تم تحديث حالة الطلب!');
        } catch {
            toast.error('فشل تحديث الطلب.');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <section className="space-y-8" dir="rtl">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white">طلبات المتجر الإلكتروني</h1>
                    <p className="text-white/40 text-sm mt-1">إدارة طلبات العملاء من متجرك العام (B2C)</p>
                </div>
                <button
                    onClick={() => window.open(`/salon/${tenantId}`, '_blank')}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold text-sm hover:bg-cyan-500/20 transition-all"
                >
                    <span className="material-symbols-outlined text-sm">storefront</span>
                    فتح المتجر
                </button>
            </header>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { label: 'إجمالي الطلبات', value: stats.total,     color: 'text-white' },
                        { label: 'في الانتظار',    value: stats.pending,   color: 'text-yellow-400' },
                        { label: 'مؤكدة',          value: stats.confirmed, color: 'text-blue-400' },
                        { label: 'تم التسليم',     value: stats.delivered, color: 'text-green-400' },
                        { label: 'الإيرادات',      value: `${(stats.revenue || 0).toLocaleString()} ج.م`, color: 'text-cyan-400' },
                    ].map((s, i) => (
                        <div key={i} className="glass rounded-2xl p-5 border border-white/5">
                            <p className="text-white/40 text-xs mb-2">{s.label}</p>
                            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Orders Table */}
            <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                {orders.length === 0 ? (
                    <div className="text-center py-16 text-white/30">
                        <span className="material-symbols-outlined text-6xl block mb-4">local_shipping</span>
                        <p className="font-bold mb-2">لا يوجد طلبات بعد</p>
                        <p className="text-sm">شارك رابط متجرك مع عملائك ليبدأوا الطلب!</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="border-b border-white/5 text-white/40 text-xs uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">رقم الطلب</th>
                                    <th className="px-6 py-4">العميل</th>
                                    <th className="px-6 py-4">العنوان</th>
                                    <th className="px-6 py-4">المبلغ</th>
                                    <th className="px-6 py-4">التاريخ</th>
                                    <th className="px-6 py-4">الحالة</th>
                                    <th className="px-6 py-4">تحديث</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {orders.map(order => (
                                    <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 font-mono text-cyan-400 font-bold">{order.order_number}</td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-white">{order.customer_name}</p>
                                            <p className="text-white/40 text-xs">{order.customer_phone}</p>
                                        </td>
                                        <td className="px-6 py-4 text-white/50 text-xs max-w-[150px] truncate">{order.customer_address}</td>
                                        <td className="px-6 py-4 font-bold text-white">{parseFloat(order.total_amount).toLocaleString()} ج.م</td>
                                        <td className="px-6 py-4 text-white/40 text-xs">{new Date(order.created_at).toLocaleDateString('ar-EG')}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[order.status] || ''}`}>
                                                {statusLabels[order.status] || order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={order.status}
                                                onChange={e => updateStatus(order.id, e.target.value)}
                                                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none cursor-pointer hover:border-cyan-500/40 transition-all"
                                            >
                                                <option value="pending">في الانتظار</option>
                                                <option value="confirmed">مؤكد</option>
                                                <option value="shipped">تم الشحن</option>
                                                <option value="delivered">تم التسليم</option>
                                                <option value="cancelled">ملغي</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
}
