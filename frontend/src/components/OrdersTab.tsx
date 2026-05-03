import { useState, useEffect } from 'react';
import api from '../api/config';
import toast from 'react-hot-toast';
import { ShoppingCart, MapPin, Clock, CheckCircle, Truck, Package, XCircle } from 'lucide-react';

const statusConfig: Record<string, { label: string, color: string, icon: React.ComponentType<any> }> = {
    pending:   { label: 'في الانتظار', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10', icon: Clock },
    processing:{ label: 'قيد التحضير', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10', icon: Package },
    shipped:   { label: 'تم الشحن', color: 'text-violet-400 border-violet-500/30 bg-violet-500/10', icon: Truck },
    delivered: { label: 'تم التسليم', color: 'text-green-400 border-green-500/30 bg-green-500/10', icon: CheckCircle },
    cancelled: { label: 'ملغي', color: 'text-red-400 border-red-500/30 bg-red-500/10', icon: XCircle },
};

interface CompanyOrder {
    id: string;
    status: string;
    total_amount: string | number;
    created_at: string;
    client?: {
        salon_name: string;
        city: string;
    };
    items?: {
        product: { name: string };
        quantity: number;
    }[];
}

export default function OrdersTab() {
    const [orders, setOrders] = useState<CompanyOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/crm/orders');
            setOrders(res.data.data || []);
        } catch (err) {
            toast.error('فشل تحميل الطلبات');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId: string, status: string) => {
        try {
            await api.patch(`/crm/orders/${orderId}/status`, { status });
            toast.success('تم تحديث حالة الطلب');
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
        } catch (err) {
            toast.error('فشل تحديث الحالة');
        }
    };

    if (loading) return <div className="py-20 text-center text-white/40">جاري التحميل...</div>;

    return (
        <div className="space-y-6 text-right rtl" dir="rtl">
            <div>
                <h2 className="text-2xl font-bold text-white">الطلبات الواردة (Incoming B2B Orders)</h2>
                <p className="text-sm text-white/50">تابع طلبات الجملة من الصالونات وقم بتحديث حالات الشحن.</p>
            </div>

            <div className="space-y-4">
                {orders.length === 0 ? (
                    <div className="py-20 text-center bg-white/5 border border-white/10 rounded-3xl">
                        <ShoppingCart size={48} className="mx-auto text-white/10 mb-4" />
                        <p className="text-white/40">لا توجد طلبات واردة حالياً</p>
                    </div>
                ) : orders.map((order) => {
                    const StatusIcon = statusConfig[order.status]?.icon || Clock;
                    return (
                        <div key={order.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-cyan-500/20 transition-all">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl font-mono font-bold">
                                            #{order.id.split('-')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{order.client?.salon_name || 'عميل غير معروف'}</h3>
                                            <div className="flex items-center gap-4 text-xs text-white/40">
                                                <span className="flex items-center gap-1"><MapPin size={14} /> {order.client?.city}</span>
                                                <span className="flex items-center gap-1"><Clock size={14} /> {new Date(order.created_at).toLocaleDateString('ar-EG')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                                            <p className="text-[10px] text-white/30 uppercase mb-2">المنتجات المطلوبة</p>
                                            <div className="space-y-2">
                                                {order.items?.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-xs">
                                                        <span className="text-white/70">{item.product?.name}</span>
                                                        <span className="text-cyan-400 font-bold">x{item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-black/40 rounded-2xl p-4 border border-white/5 flex flex-col justify-center">
                                            <p className="text-[10px] text-white/30 uppercase mb-1">إجمالي المبلغ</p>
                                            <p className="text-2xl font-black text-white">{Number(order.total_amount || 0).toLocaleString()} ج.م</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="md:w-64 flex flex-col justify-between gap-4">
                                    <div className={`px-4 py-2 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm ${statusConfig[order.status]?.color || 'text-white/40 border-white/10'}`}>
                                        <StatusIcon size={18} />
                                        {statusConfig[order.status]?.label || 'حالة غير معروفة'}
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-[10px] text-white/30 mr-2">تغيير الحالة إلى:</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
                                                <button 
                                                    key={s}
                                                    onClick={() => updateStatus(order.id, s)}
                                                    className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${order.status === s ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20'}`}
                                                >
                                                    {statusConfig[s].label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
