import React from 'react';
import { Shield, Info } from 'lucide-react';
import { AISecurityLog, Stats } from '../../types/admin';

interface AIShieldTabProps {
    stats: Stats | null;
    aiSecurityLogs: AISecurityLog[];
}

const AIShieldTab: React.FC<AIShieldTabProps> = ({ stats, aiSecurityLogs }) => {
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <Shield className="text-cyan-400" />
                    مراقب AI Shield (الأمن الذكي)
                </h2>
                <div className="flex gap-4">
                    <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10 text-center">
                        <p className="text-[10px] text-white/40 uppercase">معدل الدقة</p>
                        <p className="text-lg font-black text-green-400">{stats?.aiStats?.aiSuccessRate ?? 98}%</p>
                    </div>
                    <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10 text-center">
                        <p className="text-[10px] text-white/40 uppercase">تنبيهات الهلوسة</p>
                        <p className="text-lg font-black text-red-400">{stats?.aiStats?.hallucinationAlerts ?? 0}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xs font-bold text-white/20 uppercase tracking-widest px-2">سجل العمليات الأمنية الأخير</h3>
                    <div className="bg-[#121214] border border-white/5 rounded-[32px] overflow-hidden">
                        <table className="w-full text-right text-xs">
                            <thead className="bg-white/5 border-b border-white/5">
                                <tr><th className="p-4">الصالون</th><th className="p-4">النموذج</th><th className="p-4">الحالة</th><th className="p-4">التوقيت</th></tr>
                            </thead>
                            <tbody>
                                {aiSecurityLogs.map(log => (
                                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                        <td className="p-4 font-bold">{log.tenant_name}</td>
                                        <td className="p-4 text-white/40">{log.model}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-lg ${log.is_hallucination ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                                {log.is_hallucination ? 'تحذير أمني' : 'آمن'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-white/20">{new Date(log.created_at).toLocaleTimeString('ar-EG')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 p-6 rounded-[32px] border border-cyan-500/30">
                        <h4 className="font-bold mb-4 flex items-center gap-2"><Info size={16} /> توزيع الاستهلاك</h4>
                        <div className="space-y-4">
                            {stats?.aiStats?.usageByTenant?.map((tenant, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="font-bold">{tenant.name}</span>
                                        <span className="text-white/40">{tenant.messages} رسالة</span>
                                    </div>
                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-cyan-400" style={{ width: `${Math.min(100, (tenant.messages / 1000) * 100)}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIShieldTab;
