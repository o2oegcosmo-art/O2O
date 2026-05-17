import React from 'react';
import { UserCheck, DollarSign, TrendingUp } from 'lucide-react';
import { AffiliateMarket } from '../../types/admin';

interface AffiliatesTabProps {
    affiliates: AffiliateMarket[];
}

const AffiliatesTab: React.FC<AffiliatesTabProps> = ({ affiliates }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
                <UserCheck className="text-fuchsia-500" />
                إدارة شبكة المسوقين (Affiliates)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#121214] p-6 rounded-[32px] border border-white/5">
                    <TrendingUp className="text-cyan-400 mb-2" size={20} />
                    <p className="text-[10px] text-white/40 uppercase font-bold">إجمالي النقرات</p>
                    <p className="text-2xl font-black">{affiliates.reduce((acc, curr) => acc + (curr.clicks_count || 0), 0)}</p>
                </div>
                <div className="bg-[#121214] p-6 rounded-[32px] border border-white/5">
                    <UserCheck className="text-fuchsia-400 mb-2" size={20} />
                    <p className="text-[10px] text-white/40 uppercase font-bold">إجمالي التسجيلات</p>
                    <p className="text-2xl font-black">{affiliates.reduce((acc, curr) => acc + (curr.referred_tenants_count || 0), 0)}</p>
                </div>
                <div className="bg-[#121214] p-6 rounded-[32px] border border-white/5">
                    <DollarSign className="text-green-400 mb-2" size={20} />
                    <p className="text-[10px] text-white/40 uppercase font-bold">إجمالي العمولات المستحقة</p>
                    <p className="text-2xl font-black">{affiliates.reduce((acc, curr) => acc + (curr.balance || 0), 0).toLocaleString()} ج.م</p>
                </div>
            </div>

            <div className="bg-[#121214] border border-white/5 rounded-[32px] overflow-hidden">
                <table className="w-full text-right text-sm">
                    <thead className="bg-white/5 border-b border-white/5">
                        <tr><th className="p-6">المسوق</th><th className="p-6">كود الخصم</th><th className="p-6">العمولة %</th><th className="p-6">الرصيد الحالي</th><th className="p-6">إجمالي الأرباح</th><th className="p-6">الحالة</th></tr>
                    </thead>
                    <tbody>
                        {affiliates.length === 0 ? (
                            <tr><td colSpan={6} className="p-20 text-center text-white/20">لا يوجد مسوقين نشطين حالياً</td></tr>
                        ) : affiliates.map(affiliate => (
                            <tr key={affiliate.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                <td className="p-6 font-bold">
                                    <p>{affiliate.user?.name}</p>
                                    <p className="text-[10px] text-white/40 font-mono">{affiliate.user?.phone}</p>
                                </td>
                                <td className="p-6 font-mono text-cyan-400 font-bold">{affiliate.promo_code}</td>
                                <td className="p-6">{affiliate.commission_percentage}%</td>
                                <td className="p-6 text-green-400 font-bold">{affiliate.balance.toLocaleString()} ج.م</td>
                                <td className="p-6 text-white/40">{affiliate.total_earned.toLocaleString()} ج.م</td>
                                <td className="p-6">
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${affiliate.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                        {affiliate.status === 'active' ? 'نشط' : 'موقوف'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AffiliatesTab;
