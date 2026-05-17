import React, { useState } from 'react';
import { Service, InventoryItem } from '../../types/salon';
import { Layers, X } from 'lucide-react';
import api from '../../api/config';
import toast from 'react-hot-toast';

interface ServicesTabProps {
    services: Service[];
    inventory: InventoryItem[];
    setEditingService: (service: Service | null) => void;
    setServiceForm: (form: any) => void;
    setShowServiceModal: (val: boolean) => void;
    handleDeleteService: (id: string) => void;
}

const ServicesTab: React.FC<ServicesTabProps> = ({
    services,
    inventory,
    setEditingService,
    setServiceForm,
    setShowServiceModal,
    handleDeleteService
}) => {
    const [showMaterialModal, setShowMaterialModal] = useState(false);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [materialForm, setMaterialForm] = useState({ inventory_item_id: '', quantity_used: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const openMaterialModal = (service: Service) => {
        setSelectedService(service);
        setShowMaterialModal(true);
    };

    const handleLinkMaterial = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/inventory/link-service', {
                service_id: selectedService.id,
                inventory_item_id: materialForm.inventory_item_id,
                quantity_used: materialForm.quantity_used
            });
            toast.success('تم ربط المادة بالخدمة بنجاح');
            setMaterialForm({ inventory_item_id: '', quantity_used: '' });
            // Re-fetch service details if needed, but for now we just show success
        } catch (err) {
            toast.error('فشل ربط المادة');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="text-right rtl" dir="rtl">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black text-white tracking-tighter">قائمة الخدمات والأسعار</h2>
                <button 
                    className="bg-gradient-to-r from-violet-600 to-pink-600 text-white font-black px-6 py-3 rounded-2xl shadow-xl shadow-violet-600/20 hover:scale-105 transition-all" 
                    onClick={() => { setEditingService(null); setServiceForm({ name: '', description: '', price: '', status: 'active', image_file: null, image_preview: null }); setShowServiceModal(true); }}
                >
                    + إضافة خدمة جديدة
                </button>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block bg-[#0D0D10]/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 overflow-hidden">
                <table className="w-full text-right">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/5">
                            <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">الخدمة</th>
                            <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest text-center">السعر</th>
                            <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest text-center">الخامات المستهلكة</th>
                            <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {services.length > 0 ? services.map(s => (
                            <tr key={s.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                                            {s.image_url ? (
                                                <img src={s.image_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="material-symbols-outlined text-white/20 text-xl">spa</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-white">{s.name}</span>
                                            <span className="text-[10px] text-white/20 line-clamp-1">{s.description || 'بدون وصف'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="font-black text-violet-400">{s.price} ج.م</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => openMaterialModal(s)}
                                        className="text-[10px] font-black uppercase tracking-widest bg-cyan-500/10 text-cyan-400 px-3 py-1.5 rounded-lg border border-cyan-500/20 hover:bg-cyan-500/20 transition-all flex items-center gap-2 mx-auto"
                                    >
                                        <Layers size={12} />
                                        إدارة الاستهلاك
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => { 
                                            setEditingService(s); 
                                            setServiceForm({ 
                                                name: s.name, 
                                                description: s.description || '', 
                                                price: (s.price || 0).toString(), 
                                                status: s.status, 
                                                image_file: null, 
                                                image_preview: s.image_url || null 
                                            }); 
                                            setShowServiceModal(true); 
                                        }} className="p-2 hover:bg-white/5 text-white/30 hover:text-white rounded-xl transition-all">
                                            <span className="material-symbols-outlined text-lg">edit</span>
                                        </button>
                                        <button onClick={() => handleDeleteService(s.id)} className="p-2 hover:bg-red-500/10 text-white/30 hover:text-red-400 rounded-xl transition-all">
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={4} className="px-6 py-20 text-center text-white/20 italic">لا يوجد خدمات مضافة بعد.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile View */}
            <div className="lg:hidden space-y-4">
                {services.map(s => (
                    <div key={s.id} className="bg-slate-900/50 backdrop-blur-xl p-5 rounded-[2.5rem] border border-white/5 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                                    {s.image_url ? <img src={s.image_url} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-white/20 text-xl">spa</span>}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm">{s.name}</h3>
                                    <p className="text-[10px] font-black text-violet-400">{s.price} ج.م</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => openMaterialModal(s)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400"><Layers size={18} /></button>
                                <button onClick={() => { setEditingService(s); setShowServiceModal(true); }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-white/40"><span className="material-symbols-outlined text-lg">edit</span></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Material Link Modal */}
            {showMaterialModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[2000] p-4">
                    <div className="bg-[#0D0D10] border border-white/10 w-full max-w-lg p-8 rounded-[2.5rem] relative text-right" dir="rtl">
                        <button onClick={() => setShowMaterialModal(false)} className="absolute top-6 left-6 text-white/40 hover:text-white"><X size={24} /></button>
                        <h3 className="text-2xl font-black text-white mb-2">إدارة استهلاك الخامات</h3>
                        <p className="text-xs text-white/40 mb-8">اربط المواد المستخدمة بخدمة <span className="text-cyan-400">"{selectedService?.name}"</span> لخصمها من المخزن تلقائياً.</p>
                        
                        <form onSubmit={handleLinkMaterial} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block mr-1">اختر المادة من المخزن</label>
                                <select 
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-cyan-500"
                                    value={materialForm.inventory_item_id}
                                    onChange={e => setMaterialForm({...materialForm, inventory_item_id: e.target.value})}
                                >
                                    <option value="" className="bg-slate-900">-- اختر من المستودع --</option>
                                    {inventory.filter(i => i.is_consumable).map(item => (
                                        <option key={item.id} value={item.id} className="bg-slate-900">{item.name} (المتوفر: {item.quantity_in_stock} {item.unit})</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block mr-1">الكمية المستهلكة في المرة الواحدة</label>
                                <div className="relative">
                                    <input 
                                        type="number"
                                        step="0.01"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-cyan-500"
                                        placeholder="مثال: 50"
                                        value={materialForm.quantity_used}
                                        onChange={e => setMaterialForm({...materialForm, quantity_used: e.target.value})}
                                    />
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/20 uppercase tracking-widest">
                                        {inventory.find(i => String(i.id) === materialForm.inventory_item_id)?.unit || 'وحدة'}
                                    </span>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full bg-cyan-500 py-4 rounded-2xl font-black text-black shadow-xl shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? 'جاري الحفظ...' : 'تأكيد ربط المادة'}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-white/5">
                            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">المواد المرتبطة حالياً:</h4>
                            {/* Note: This would ideally be a separate API call to get materials for this service, but for now we provide the UI to add them */}
                            <p className="text-[10px] text-white/20 italic">سيتم خصم هذه الكميات من المخزن فور الضغط على "إتمام الحجز" لهذه الخدمة.</p>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default ServicesTab;
