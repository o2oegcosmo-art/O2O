import { useState, useEffect } from 'react';
import api from '../api/config';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Plus, Phone, MapPin, LayoutGrid } from 'lucide-react';

const stages = [
    { id: 'new_lead', label: 'مهتم جديد', color: 'border-white/10' },
    { id: 'contacted', label: 'تم التواصل', color: 'border-blue-500/30' },
    { id: 'proposal', label: 'عرض سعر', color: 'border-amber-500/30' },
    { id: 'negotiation', label: 'تفاوض', color: 'border-violet-500/30' },
    { id: 'won', label: 'تم التعاقد', color: 'border-green-500/30' },
    { id: 'lost', label: 'مستبعد', color: 'border-red-500/30' },
];

interface Props {
    viewMode?: 'clients' | 'pipeline';
}

export default function CrmPipelineTab({ viewMode = 'pipeline' }: Props) {

    const [pipeline, setPipeline] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [showVisitModal, setShowVisitModal] = useState(false);
    const [selectedOpp, setSelectedOpp] = useState<any>(null);
    const [visitForm, setVisitForm] = useState({ notes: '', outcome: 'follow_up' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchPipeline();
    }, []);

    const fetchPipeline = async () => {
        try {
            const res = await api.get('/crm/pipeline');
            const rawData = Array.isArray(res.data) ? res.data : (res.data.data || []);
            
            // Group flat data into stages
            const grouped: any = {};
            stages.forEach(s => grouped[s.id] = []);
            rawData.forEach((item: any) => {
                if (grouped[item.stage]) grouped[item.stage].push(item);
                else grouped['new_lead']?.push(item);
            });
            setPipeline(grouped);
        } catch (err) {
            toast.error('فشل تحميل خط المبيعات');
        } finally {
            setLoading(false);
        }
    };

    const updateStage = async (oppId: string, stage: string) => {
        try {
            await api.patch(`/crm/pipeline/${oppId}`, { stage });
            toast.success('تم تحديث المرحلة');
            fetchPipeline();
        } catch (err) {
            toast.error('فشل التحديث');
        }
    };

    const handleCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!navigator.geolocation) {
            toast.error('متصفحك لا يدعم تحديد الموقع الجغرافي');
            setIsSubmitting(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                
                await api.post('/crm/visits', {
                    staff_id: (JSON.parse(localStorage.getItem('o2oeg_user') || '{}')).id, // assuming user is staff
                    crm_client_id: selectedOpp.crm_client?.id,
                    notes: visitForm.notes,
                    outcome: visitForm.outcome,
                    latitude,
                    longitude
                });

                toast.success('تم تسجيل الزيارة بنجاح (تم التحقق من الموقع)');
                setShowVisitModal(false);
                setVisitForm({ notes: '', outcome: 'follow_up' });
                fetchPipeline();
            } catch (err: any) {
                const msg = err.response?.data?.message || 'فشل تسجيل الزيارة';
                toast.error(msg, { duration: 5000 });
            } finally {
                setIsSubmitting(false);
            }
        }, (_err) => {
            toast.error('يرجى تفعيل صلاحية الموقع الجغرافي لتسجيل الزيارة');
            setIsSubmitting(false);
        });
    };

    if (loading) return <div className="py-20 text-center text-white/40">جاري التحميل...</div>;

    // --- عرض قائمة العملاء (الصالونات المتعاقدة) ---
    if (viewMode === 'clients') {
        const allClients: any[] = [];
        stages.forEach(s => {
            (pipeline[s.id] || []).forEach((opp: any) => {
                if (opp.crm_client && !allClients.find(c => c.id === opp.crm_client.id)) {
                    allClients.push({ ...opp.crm_client, stage: s.label, stageColor: s.color, estimated_value: opp.estimated_value });
                }
            });
        });

        return (
            <div className="space-y-4" dir="rtl">
                <button className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-2xl transition-all flex items-center gap-2 border border-white/10">
                    <Plus size={18} /> إضافة صالون جديد
                </button>

                {allClients.length === 0 ? (
                    <div className="py-20 text-center bg-white/5 border border-white/10 rounded-3xl">
                        <p className="text-white/30 text-sm">لا توجد صالونات مسجلة حتى الآن</p>
                        <p className="text-white/20 text-xs mt-1">قم بإضافة أول صالون لبدء تتبع التعاملات</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allClients.map((client, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-cyan-500/20 transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-600 to-cyan-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
                                        {client.salon_name?.charAt(0) || 'S'}
                                    </div>
                                    <span className={`text-[9px] font-bold px-2 py-1 rounded-full border ${client.stageColor} bg-white/5`}>
                                        {client.stage}
                                    </span>
                                </div>
                                <h3 className="font-bold text-white mb-1">{client.salon_name}</h3>
                                <div className="space-y-1 text-[11px] text-white/40">
                                    <div className="flex items-center gap-2"><Phone size={11} /> {client.phone}</div>
                                    <div className="flex items-center gap-2"><MapPin size={11} /> {client.city}</div>
                                </div>
                                {client.estimated_value && (
                                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                                        <span className="text-[10px] text-white/30">قيمة الصفقة المتوقعة</span>
                                        <span className="text-cyan-400 font-black text-sm">{Number(client.estimated_value).toLocaleString()} ج.م</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // --- عرض Pipeline Kanban ---
    return (

        <div className="space-y-6 text-right rtl" dir="rtl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">إدارة الصالونات (CRM Pipeline)</h2>
                    <p className="text-sm text-white/50">تتبع مراحل تعاقدك مع الصالونات وحولهم لشركاء دائمين.</p>
                </div>
                <button className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-2xl transition-all flex items-center gap-2 border border-white/10">
                    <Plus size={20} /> إضافة صالون جديد
                </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-6 -mx-6 px-6">
                {stages.map((stage) => (
                    <div key={stage.id} className="min-w-[300px] flex flex-col gap-4">
                        <div className={`p-4 rounded-2xl border ${stage.color} bg-white/5 flex items-center justify-between`}>
                            <h3 className="font-bold text-white text-sm">{stage.label}</h3>
                            <span className="bg-white/10 text-[10px] text-white px-2 py-0.5 rounded-full">{pipeline[stage.id]?.length || 0}</span>
                        </div>

                        <div className="space-y-3 min-h-[500px]">
                            {pipeline[stage.id]?.map((opp: any) => (
                                <motion.div 
                                    key={opp.id}
                                    layoutId={opp.id}
                                    className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:border-cyan-500/30 transition-all cursor-move group"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-bold text-white text-sm">{opp.crm_client?.salon_name || opp.title}</h4>
                                        <div className="flex gap-1">
                                            {stages.filter(s => s.id !== stage.id).map(s => (
                                                <button 
                                                    key={s.id} 
                                                    onClick={() => updateStage(opp.id, s.id)}
                                                    title={`نقل إلى ${s.label}`}
                                                    className="w-5 h-5 rounded bg-white/5 hover:bg-cyan-500/20 text-white/20 hover:text-cyan-400 flex items-center justify-center transition-all"
                                                >
                                                    <LayoutGrid size={10} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 text-[10px] text-white/40">
                                        <div className="flex items-center gap-2"><Phone size={12} /> {opp.crm_client?.phone || 'بدون رقم'}</div>
                                        <div className="flex items-center gap-2"><MapPin size={12} /> {opp.crm_client?.city || 'بدون مدينة'}</div>
                                    </div>
                                    <button 
                                        onClick={() => { setSelectedOpp(opp); setShowVisitModal(true); }}
                                        className="w-full mt-3 py-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold rounded-lg hover:bg-cyan-500 hover:text-black transition-all flex items-center justify-center gap-1"
                                    >
                                        <MapPin size={10} /> تسجيل زيارة (Check-in)
                                    </button>
                                    <div className="mt-4 flex justify-between items-center">
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${opp.estimated_value > 50000 ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-400'}`}>
                                            {opp.estimated_value?.toLocaleString()} ج.م
                                        </span>
                                        <span className="text-[10px] text-white/20 font-mono">#{opp.id.split('-')[0].toUpperCase()}</span>
                                    </div>
                                </motion.div>
                            ))}
                            {(!pipeline[stage.id] || pipeline[stage.id].length === 0) && (
                                <div className="h-20 border border-dashed border-white/5 rounded-2xl flex items-center justify-center text-[10px] text-white/10 italic">
                                    اسحب صالونات هنا
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Visit Modal */}
            {showVisitModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <div onClick={() => setShowVisitModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                    <div className="relative w-full max-w-md bg-[#121214] border border-white/10 rounded-[40px] p-8">
                        <h3 className="text-xl font-bold mb-2 text-white text-right">تسجيل زيارة ميدانية</h3>
                        <p className="text-xs text-white/40 mb-6 text-right">سيتم التحقق من موقعك الجغرافي الحالي لضمان التواجد في الصالون.</p>
                        
                        <form onSubmit={handleCheckIn} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] text-white/40 mr-2 text-right block">نتيجة الزيارة</label>
                                <select value={visitForm.outcome} onChange={e => setVisitForm({...visitForm, outcome: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-cyan-500">
                                    <option value="follow_up">متابعة لاحقة</option>
                                    <option value="demo_given">تم عمل عرض تجريبي</option>
                                    <option value="order_placed">تم استلام طلبية</option>
                                    <option value="rejected">مرفوض حالياً</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-white/40 mr-2 text-right block">ملاحظات الزيارة</label>
                                <textarea value={visitForm.notes} onChange={e => setVisitForm({...visitForm, notes: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white h-24 focus:outline-none focus:border-cyan-500 text-right" placeholder="اكتب ما حدث في الزيارة..." />
                            </div>
                            
                            <button disabled={isSubmitting} type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-cyan-400 text-black font-black py-4 rounded-2xl shadow-lg shadow-cyan-600/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                                {isSubmitting ? 'جاري التحقق من الموقع...' : (
                                    <>
                                        <MapPin size={16} /> تأكيد التواجد وتسجيل الزيارة
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
