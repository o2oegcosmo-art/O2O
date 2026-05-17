import React from 'react';
import { ShoppingBag, DollarSign } from 'lucide-react';
import { Stats } from '../../types/admin';

interface B2BAnalyticsTabProps {
    stats: Stats | null;
}

const B2BAnalyticsTab: React.FC<B2BAnalyticsTabProps> = ({ stats }) => {
    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold">إحصائيات سوق الجملة B2B</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[#121214] p-8 rounded-[40px] border border-white/5 text-center">
                    <div className="w-16 h-16 bg-cyan-500/10 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4"><ShoppingBag /></div>
                    <h4 className="text-white/40 text-sm">إجمالي الطلبات</h4>
                    <p className="text-4xl font-black">{stats?.b2bStats?.totalOrders ?? 0}</p>
                </div>
                <div className="bg-[#121214] p-8 rounded-[40px] border border-white/5 text-center">
                    <div className="w-16 h-16 bg-fuchsia-500/10 text-fuchsia-400 rounded-full flex items-center justify-center mx-auto mb-4"><DollarSign /></div>
                    <h4 className="text-white/40 text-sm">حجم التداول GMV</h4>
                    <p className="text-4xl font-black">{(stats?.b2bStats?.totalValue ?? 0).toLocaleString()} ج.م</p>
                </div>
            </div>
        </div>
    );
};

export default B2BAnalyticsTab;
