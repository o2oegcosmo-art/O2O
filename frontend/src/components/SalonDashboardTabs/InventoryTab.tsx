import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Trash2, Edit3, AlertTriangle, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/config';
import toast from 'react-hot-toast';

interface InventoryItem {
    id: string | number;
    name: string;
    sku: string;
    unit: string;
    quantity_in_stock: number;
    cost_per_unit: number;
    price: number;
    is_retail: boolean;
    is_consumable: boolean;
}

export default function InventoryTab() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [form, setForm] = useState({
        name: '',
        sku: '',
        unit: 'piece',
        quantity_in_stock: 0,
        cost_per_unit: 0,
        price: 0,
        is_retail: false,
        is_consumable: true
    });

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const res = await api.get('/inventory');
            setItems(res.data.data);
        } catch (err) {
            console.error("Error fetching inventory", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await api.put(`/inventory/${editingItem.id}`, form);
                toast.success('تم تحديث بيانات المخزن');
            } else {
                await api.post('/inventory', form);
                toast.success('تم إضافة المادة للمخزن');
            }
            setShowModal(false);
            setEditingItem(null);
            setForm({ name: '', sku: '', unit: 'piece', quantity_in_stock: 0, cost_per_unit: 0, price: 0, is_retail: false, is_consumable: true });
            fetchItems();
        } catch (err) {
            toast.error('فشل حفظ البيانات');
        }
    };

    const deleteItem = async (id: string | number) => {
        if (!window.confirm('هل أنت متأكد من حذف هذه المادة؟')) return;
        try {
            await api.delete(`/inventory/${id}`);
            toast.success('تم الحذف بنجاح');
            fetchItems();
        } catch (err) {
            toast.error('فشل في الحذف');
        }
    };

    const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.sku?.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="space-y-8 text-right rtl" dir="rtl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter">المستودع والمخزون</h2>
                    <p className="text-sm text-white/50">تتبع خامات الصالون، المنتجات الاستهلاكية، وأدوات البيع.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                        <input 
                            type="text" 
                            placeholder="ابحث عن مادة..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl py-3 pr-10 pl-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 w-full md:w-64"
                        />
                    </div>
                    <button 
                        onClick={() => { setEditingItem(null); setForm({ name: '', sku: '', unit: 'piece', quantity_in_stock: 0, cost_per_unit: 0, price: 0, is_retail: false, is_consumable: true }); setShowModal(true); }}
                        className="bg-gradient-to-r from-cyan-500 to-violet-600 p-3 rounded-2xl text-white shadow-lg shadow-cyan-500/20 hover:scale-105 transition-all"
                    >
                        <Plus size={24} />
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex items-center gap-4">
                    <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400">
                        <Layers size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">إجمالي الأصناف</p>
                        <h4 className="text-2xl font-black text-white">{items.length}</h4>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">أصناف قاربت على النفاذ</p>
                        <h4 className="text-2xl font-black text-white">{items.filter(i => i.quantity_in_stock < 5).length}</h4>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex items-center gap-4">
                    <div className="w-12 h-12 bg-fuchsia-500/10 rounded-2xl flex items-center justify-center text-fuchsia-400">
                        <Package size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">قيمة المخزون</p>
                        <h4 className="text-2xl font-black text-white">
                            {items.reduce((sum, i) => sum + (i.quantity_in_stock * i.cost_per_unit), 0).toLocaleString()} ج.م
                        </h4>
                    </div>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-[#0D0D10]/80 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-white/5">
                                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">الصنف</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">الكمية</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">وحدة القياس</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">تكلفة الوحدة</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">النوع</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-20 text-center text-white/40">جاري تحميل البيانات...</td></tr>
                            ) : filteredItems.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-20 text-center text-white/40">لا توجد مواد في المخزن حالياً.</td></tr>
                            ) : filteredItems.map((item) => (
                                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-white">{item.name}</span>
                                            <span className="text-[10px] text-white/20">SKU: {item.sku || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-black ${item.quantity_in_stock < 5 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                            {item.quantity_in_stock}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-white/60">{item.unit}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-white">{item.cost_per_unit} ج.م</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            {item.is_consumable && <span className="text-[9px] bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded font-black">استهلاكي</span>}
                                            {item.is_retail && <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded font-black">للبيع</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => { setEditingItem(item); setForm({ ...item }); setShowModal(true); }}
                                                className="p-2 hover:bg-cyan-500/10 text-white/30 hover:text-cyan-400 rounded-xl transition-all"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => deleteItem(item.id)}
                                                className="p-2 hover:bg-red-500/10 text-white/30 hover:text-red-400 rounded-xl transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[2000] p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#0D0D10] border border-white/10 w-full max-w-xl p-8 rounded-[2.5rem] relative"
                    >
                        <h3 className="text-2xl font-black text-white mb-8">{editingItem ? 'تعديل صنف' : 'إضافة صنف جديد'}</h3>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block mr-1">اسم الصنف</label>
                                <input 
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-cyan-500"
                                    value={form.name}
                                    onChange={e => setForm({...form, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block mr-1">كود الصنف (SKU)</label>
                                <input 
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-cyan-500"
                                    value={form.sku}
                                    onChange={e => setForm({...form, sku: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block mr-1">وحدة القياس</label>
                                <select 
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-cyan-500"
                                    value={form.unit}
                                    onChange={e => setForm({...form, unit: e.target.value})}
                                >
                                    <option value="piece">قطعة</option>
                                    <option value="ml">ملي (ml)</option>
                                    <option value="gram">جرام (g)</option>
                                    <option value="bottle">عبوة</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block mr-1">الكمية المتوفرة</label>
                                <input 
                                    type="number"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-cyan-500"
                                    value={form.quantity_in_stock}
                                    onChange={e => setForm({...form, quantity_in_stock: parseFloat(e.target.value)})}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block mr-1">تكلفة الوحدة</label>
                                <input 
                                    type="number"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-cyan-500"
                                    value={form.cost_per_unit}
                                    onChange={e => setForm({...form, cost_per_unit: parseFloat(e.target.value)})}
                                />
                            </div>
                            
                            <div className="flex flex-col gap-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" className="w-5 h-5 accent-cyan-500" checked={form.is_consumable} onChange={e => setForm({...form, is_consumable: e.target.checked})} />
                                    <span className="text-sm text-white/60">صنف استهلاكي (صبغات، شامبو...)</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" className="w-5 h-5 accent-cyan-500" checked={form.is_retail} onChange={e => setForm({...form, is_retail: e.target.checked})} />
                                    <span className="text-sm text-white/60">صنف للبيع المباشر للجمهور</span>
                                </label>
                            </div>

                            <div className="md:col-span-2 flex gap-4 mt-4">
                                <button type="submit" className="flex-1 bg-cyan-500 py-4 rounded-2xl font-black text-black shadow-xl shadow-cyan-500/20">حفظ البيانات</button>
                                <button type="button" onClick={() => setShowModal(false)} className="px-8 bg-white/5 py-4 rounded-2xl font-black text-white/40">إلغاء</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
