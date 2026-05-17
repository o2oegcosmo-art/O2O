import React from 'react';
import { Tenant } from '../../types/admin';

interface CompaniesTabProps {
    companies: Tenant[];
    handleToggleTenantStatus: (id: string, currentStatus: string) => void;
    fetchCompanyStats: (id: string) => void;
}

const CompaniesTab: React.FC<CompaniesTabProps> = ({ companies, handleToggleTenantStatus, fetchCompanyStats }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">إدارة الشركات ({companies.length})</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {companies.map(company => (
                    <div key={company.id} className="bg-[#121214] border border-white/5 p-6 rounded-[32px] flex justify-between items-center group hover:border-cyan-500/30 transition-all border-r-4 border-r-cyan-500">
                        <div>
                            <h3 className="font-bold text-lg">{company.name}</h3>
                            <p className="text-xs text-white/40">{company.domain}</p>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleToggleTenantStatus(company.id, company.status)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                                    company.status === 'active'
                                        ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500 hover:text-black'
                                        : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white'
                                }`}
                            >
                                {company.status === 'active' ? 'نشط' : 'موقوف'}
                            </button>
                            <button 
                                onClick={() => fetchCompanyStats(company.id)}
                                className="px-6 py-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-2xl text-[10px] font-bold hover:bg-cyan-500 hover:text-black transition-all"
                            >
                                إحصائيات المبيعات
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CompaniesTab;
