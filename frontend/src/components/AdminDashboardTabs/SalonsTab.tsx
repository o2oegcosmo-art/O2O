import React from 'react';
import { Settings } from 'lucide-react';
import { Tenant } from '../../types/admin';

interface SalonsTabProps {
    salons: Tenant[];
    handleToggleTenantStatus: (id: string, currentStatus: string) => void;
    setSelectedTenant: (tenant: Tenant | null) => void;
    setShowServiceModal: (show: boolean) => void;
}

const SalonsTab: React.FC<SalonsTabProps> = ({ salons, handleToggleTenantStatus, setSelectedTenant, setShowServiceModal }) => {
    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">إدارة الصالونات</h2>
                    <p className="text-sm text-white/40 mt-1">{salons.length} صالون مسجل في المنصة</p>
                </div>
            </header>

            {salons.length === 0 ? (
                <div className="p-20 bg-[#121214] rounded-[40px] border border-white/5 text-center">
                    <p className="text-white/20 text-sm">لا يوجد صالونات مسجلة حتى الآن</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {salons.map(salon => {
                        const activeCount = salon.services?.length || 0;

                        return (
                            <div key={salon.id} className="bg-[#121214] border border-white/5 p-6 rounded-[32px] hover:border-fuchsia-500/20 transition-all group">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-5">
                                    <div>
                                        <h3 className="font-bold text-lg text-white">{salon.name}</h3>
                                        <p className="text-xs text-white/30 mt-0.5 font-mono">{salon.domain}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleToggleTenantStatus(salon.id, salon.status)}
                                        className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all cursor-pointer ${
                                            salon.status === 'active' 
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500 hover:text-black' 
                                                : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white'
                                        }`}>
                                        {salon.status === 'active' ? 'نشط' : 'موقوف'}
                                    </button>
                                </div>

                                {/* Active Services Count */}
                                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-3">
                                    الخدمات المفعّلة ({activeCount} / 5)
                                </p>

                                {/* Services Grid */}
                                <div className="grid grid-cols-2 gap-2 mb-5">
                                    {[
                                        { slug: 'smart-booking-system', name: 'الحجوزات الذكية', color: 'cyan' },
                                        { slug: 'crm-system', name: 'إدارة العملاء', color: 'blue' },
                                        { slug: 'public-page', name: 'الصفحة العامة', color: 'fuchsia' },
                                        { slug: 'e-commerce', name: 'المتجر الإلكتروني', color: 'amber' },
                                        { slug: 'events-management', name: 'الفعاليات', color: 'green' },
                                    ].map(ps => {
                                        const isServiceEnabled = (salon.services || []).some(s => s.slug === ps.slug);
                                        const colorMap: Record<string, string> = {
                                            cyan: isServiceEnabled ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-white/3 text-white/20 border-white/5',
                                            blue: isServiceEnabled ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-white/3 text-white/20 border-white/5',
                                            fuchsia: isServiceEnabled ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30' : 'bg-white/3 text-white/20 border-white/5',
                                            amber: isServiceEnabled ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-white/3 text-white/20 border-white/5',
                                            pink: isServiceEnabled ? 'bg-pink-500/10 text-pink-400 border-pink-500/30' : 'bg-white/3 text-white/20 border-white/5',
                                            green: isServiceEnabled ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-white/3 text-white/20 border-white/5',
                                        };
                                        return (
                                            <div key={ps.slug} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-bold ${colorMap[ps.color]} transition-all`}>
                                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isServiceEnabled ? 'bg-current' : 'bg-white/10'}`}></span>
                                                {ps.name}
                                                {isServiceEnabled && <span className="mr-auto text-[8px] opacity-60">✓</span>}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Action Button */}
                                <button
                                    onClick={() => { setSelectedTenant(salon); setShowServiceModal(true); }}
                                    className="w-full py-3 bg-fuchsia-600/10 border border-fuchsia-500/20 text-fuchsia-300 rounded-2xl text-xs font-bold hover:bg-fuchsia-600 hover:text-white hover:border-fuchsia-600 transition-all flex items-center justify-center gap-2"
                                >
                                    <Settings size={14} />
                                    إدارة الخدمات والصلاحيات
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SalonsTab;
