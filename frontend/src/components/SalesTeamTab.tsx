import { useState, useEffect } from 'react';
import api from '../api/config';
import toast from 'react-hot-toast';
import { Users, MapPin, TrendingUp, UserCheck, Map as MapIcon } from 'lucide-react';
import OpenStreetMap from './OpenStreetMap';

export default function SalesTeamTab() {
    const [members, setMembers] = useState<any[]>([]);
    const [visits, setVisits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTeam();
    }, []);

    const fetchTeam = async () => {
        try {
            const [teamRes, visitsRes] = await Promise.all([
                api.get('/crm/sales-team'),
                api.get('/crm/visits')
            ]);
            setMembers(teamRes.data.data || []);
            setVisits(visitsRes.data.data || []);
        } catch (err) {
            toast.error('فشل تحميل بيانات فريق المبيعات');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="py-20 text-center text-white/40">جاري التحميل...</div>;

    return (
        <div className="space-y-8 text-right rtl" dir="rtl">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">إدارة فريق المندوبين (Sales Team)</h2>
                    <p className="text-sm text-white/50">تتبع زيارات المندوبين الميدانية وإنتاجية كل عضو في الفريق.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-2">
                        <p className="text-[10px] text-white/40">إجمالي المندوبين</p>
                        <p className="text-xl font-black text-white">{members.length}</p>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-2xl px-6 py-2">
                        <p className="text-[10px] text-green-400">زيارات اليوم</p>
                        <p className="text-xl font-black text-white">12</p>
                    </div>
                </div>
            </header>

            {/* Field Map View */}
            <div className="glass p-6 rounded-[32px] border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-400">
                            <MapIcon size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">خريطة التحركات الميدانية</h3>
                            <p className="text-sm text-white/40">توزيع جغرافي حي لآخر الزيارات المحققة من قبل المندوبين.</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-[24px] overflow-hidden border border-white/5 h-[400px]">
                    <OpenStreetMap 
                        markers={visits
                            .filter(v => v.latitude && v.longitude)
                            .map(v => ({
                                lat: Number(v.latitude),
                                lng: Number(v.longitude),
                                title: `${v.staff?.name} - ${v.crm_client?.salon_name}`
                            }))
                        } 
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Team Members List */}
                <div className="lg:col-span-2 space-y-4">
                    {members.length === 0 ? (
                        <div className="py-20 text-center bg-white/5 border border-white/10 rounded-3xl">
                            <Users size={48} className="mx-auto text-white/10 mb-4" />
                            <p className="text-white/40">لا يوجد مندوبون مسجلون حالياً</p>
                        </div>
                    ) : members.map((member, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-cyan-500/20 transition-all group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-fuchsia-600 to-cyan-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                                        {member.user?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{member.user?.name}</h3>
                                        <p className="text-xs text-white/40">{member.territory || 'منطقة غير محددة'}</p>
                                    </div>
                                </div>
                                <div className="text-left">
                                    <span className="bg-cyan-500/10 text-cyan-400 text-[10px] font-bold px-3 py-1 rounded-full border border-cyan-500/20">نشط ميدانياً</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mt-6">
                                <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                                    <p className="text-[10px] text-white/30 mb-1">الزيارات هذا الشهر</p>
                                    <p className="text-xl font-black text-white">{member.visits_count || 0}</p>
                                </div>
                                <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                                    <p className="text-[10px] text-white/30 mb-1">الصالونات الجديدة</p>
                                    <p className="text-xl font-black text-cyan-400">8</p>
                                </div>
                                <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                                    <p className="text-[10px] text-white/30 mb-1">المبيعات المحققة</p>
                                    <p className="text-xl font-black text-fuchsia-400">45k</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Live Activity Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-[32px] p-6">
                        <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                            <UserCheck size={20} className="text-green-400" /> نشاط الميدان (Live)
                        </h3>
                        <div className="space-y-6 relative before:absolute before:right-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
                            {visits.length === 0 ? (
                                <p className="text-[10px] text-white/20 pr-8 italic text-right">لا يوجد نشاط مسجل اليوم</p>
                            ) : visits.slice(0, 5).map((visit, i) => (
                                <div key={i} className="relative pr-8 text-right">
                                    <div className="absolute right-1.5 top-1.5 w-3 h-3 bg-cyan-500 rounded-full border-4 border-[#0A0A0C]" />
                                    <p className="text-[10px] text-cyan-400 font-bold mb-1">{new Date(visit.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                                    <p className="text-xs text-white font-medium mb-1">{visit.staff?.name || 'مندوب'} سجل زيارة لـ {visit.crm_client?.salon_name}</p>
                                    <p className="text-[10px] text-white/30 flex items-center justify-end gap-1">{visit.crm_client?.city} <MapPin size={10} /></p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-cyan-600/20 to-fuchsia-600/20 border border-white/10 p-6 rounded-3xl">
                        <h4 className="font-bold text-white mb-2 flex items-center gap-2"><TrendingUp size={18} className="text-cyan-400" /> نصيحة ذكية</h4>
                        <p className="text-[10px] text-white/50 leading-relaxed">
                            المندوب <span className="text-cyan-400 font-bold">أحمد علي</span> يحقق أعلى معدل زيارات في القاهرة. يمكنك تعميم أسلوبه في "العرض الميداني" على باقي أعضاء الفريق.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
