import { useState, useEffect } from 'react';
import { Plus, Package, Edit, CheckCircle, XCircle } from 'lucide-react';
import api from '../api/config';
import toast from 'react-hot-toast';

export default function CatalogTab() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [form, setForm] = useState({
        name: '',
        description: '',
        wholesale_price: '',
        retail_price: '',
        stock_quantity: '',
        image_url: '',
        category: '',
        gallery: [] as string[]
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/crm/catalog');
            setProducts(res.data);
        } catch (err) {
            toast.error('فشل تحميل المنتجات');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await api.patch(`/crm/catalog/${editingProduct.id}`, form);
                toast.success('تم تحديث المنتج بنجاح');
            } else {
                await api.post('/crm/catalog', form);
                toast.success('تم إضافة المنتج للكتالوج');
            }
            setShowModal(false);
            setEditingProduct(null);
            setForm({ name: '', description: '', wholesale_price: '', retail_price: '', stock_quantity: '', image_url: '', category: '', gallery: [] });
            fetchProducts();
        } catch (err: any) {
            let errorMessage = 'فشل حفظ المنتج';
            if (err.response && err.response.data) {
                if (err.response.data.errors) {
                    // Extract the first validation error message
                    const firstErrorKey = Object.keys(err.response.data.errors)[0];
                    if (firstErrorKey) {
                        errorMessage = err.response.data.errors[firstErrorKey][0];
                    }
                } else if (err.response.data.message) {
                    errorMessage = err.response.data.message;
                }
            }
            toast.error(errorMessage);
            console.error("Failed to save product:", err); // Log the full error for debugging
        }
    };

    const handleEdit = (product: any) => {
        setEditingProduct(product);
        setForm({
            name: product.name,
            description: product.description || '',
            wholesale_price: product.wholesale_price.toString(),
            retail_price: product.retail_price.toString(),
            stock_quantity: product.stock_quantity.toString(),
            image_url: product.image_url || '',
            category: product.category || '',
            gallery: Array.isArray(product.gallery) ? product.gallery : []
        });
        setShowModal(true);
    };

    const toggleStatus = async (product: any) => {
        try {
            await api.patch(`/crm/catalog/${product.id}`, { is_active: !product.is_active });
            toast.success('تم تحديث حالة المنتج');
            fetchProducts();
        } catch (err: any) {
            let errorMessage = 'فشل تحديث حالة المنتج';
            if (err.response && err.response.data) {
                if (err.response.data.errors) {
                    const firstErrorKey = Object.keys(err.response.data.errors)[0];
                    if (firstErrorKey) {
                        errorMessage = err.response.data.errors[firstErrorKey][0];
                    }
                } else if (err.response.data.message) {
                    errorMessage = err.response.data.message;
                }
            }
            toast.error(errorMessage);
            console.error("Failed to update product status:", err);
        }
    };

    if (loading) return <div className="py-20 text-center text-white/40">جاري التحميل...</div>;

    return (
        <div className="space-y-6 text-right rtl" dir="rtl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">إدارة الكتالوج (Product Catalog)</h2>
                    <p className="text-sm text-white/50">أضف منتجاتك الجديدة التي ستظهر للصالونات في سوق الجملة.</p>
                </div>
                <button
                    onClick={() => { setEditingProduct(null); setShowModal(true); }}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black font-black px-6 py-3 rounded-2xl transition-all flex items-center gap-2"
                >
                    <Plus size={20} /> إضافة منتج جديد
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white/5 border border-white/10 rounded-3xl">
                        <Package size={48} className="mx-auto text-white/10 mb-4" />
                        <p className="text-white/40">لا توجد منتجات في الكتالوج حالياً</p>
                    </div>
                ) : products.map((product) => (
                    <div key={product.id} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden group hover:border-cyan-500/30 transition-all flex flex-col">
                        <div className="h-40 bg-black/40 relative">
                            <img src={product.image_url || 'https://via.placeholder.com/300x200?text=No+Image'} alt={product.name} className="w-full h-full object-cover opacity-60" />
                            <div className="absolute top-3 right-3 flex gap-2">
                                <button onClick={() => handleEdit(product)} className="p-2 bg-black/60 text-white rounded-lg hover:bg-cyan-500 hover:text-black transition-all"><Edit size={16} /></button>
                                <button onClick={() => toggleStatus(product)} className={`p-2 rounded-lg transition-all ${product.is_active ? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400' : 'bg-red-500/20 text-red-400 hover:bg-green-500/20 hover:text-green-400'}`}>
                                    {product.is_active ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                </button>
                            </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <h3 className="font-bold text-white mb-1">{product.name}</h3>
                            <p className="text-[10px] text-white/40 mb-4 line-clamp-2">{product.description}</p>
                            <div className="mt-auto space-y-2 pt-4 border-t border-white/5">
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/40">سعر الجملة:</span>
                                    <span className="text-cyan-400 font-bold">{product.wholesale_price} ج.م</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/40">المخزون:</span>
                                    <span className="text-white font-bold">{product.stock_quantity} قطعة</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#121214] border border-white/10 rounded-[40px] w-full max-w-xl overflow-hidden">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">{editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white"><XCircle size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs text-white/40 mr-2">اسم المنتج</label>
                                    <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-white/40 mr-2">التصنيف</label>
                                    <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-white/40 mr-2">وصف المنتج</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white h-24 focus:outline-none focus:border-cyan-500/50" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs text-white/40 mr-2">سعر الجملة</label>
                                    <input required type="number" value={form.wholesale_price} onChange={e => setForm({ ...form, wholesale_price: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-white/40 mr-2">سعر القطاعي</label>
                                    <input required type="number" value={form.retail_price} onChange={e => setForm({ ...form, retail_price: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-white/40 mr-2">الكمية</label>
                                    <input required type="number" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-white/40 mr-2">رابط الصورة الأساسية</label>
                                <div className="flex gap-2">
                                    <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50" placeholder="رابط الصورة..." />
                                    <label className="bg-pink-600 px-4 rounded-2xl text-white font-bold text-xs flex items-center justify-center cursor-pointer hover:bg-pink-500 transition-all">
                                        رفع
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={async (e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    const file = e.target.files[0];
                                                    const formData = new FormData();
                                                    formData.append('image', file);
                                                    const loadToast = toast.loading('جاري رفع الصورة...');
                                                    try {
                                                        const res = await api.post('/upload-image', formData, {
                                                            headers: { 'Content-Type': 'multipart/form-data' }
                                                        });
                                                        if (res.data.success) {
                                                            setForm({ ...form, image_url: res.data.absolute_url || res.data.url });
                                                            toast.success('تم رفع الصورة بنجاح', { id: loadToast });
                                                        }
                                                    } catch (err) {
                                                        toast.error('فشل رفع الصورة', { id: loadToast });
                                                    }
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-white/40 mr-2">معرض صور المنتج للفيديو التسويقي (حتى 8 صور)</label>
                                <div className="flex gap-2 mb-2">
                                    <input 
                                        id="new-product-img"
                                        type="text" 
                                        placeholder="رابط صورة إضافية..." 
                                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50" 
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            const input = document.getElementById('new-product-img') as HTMLInputElement;
                                            if (input.value && form.gallery.length < 8) {
                                                setForm({ ...form, gallery: [...form.gallery, input.value] });
                                                input.value = '';
                                            } else if (form.gallery.length >= 8) {
                                                toast.error('الحد الأقصى 8 صور');
                                            }
                                        }}
                                        className="bg-cyan-600 px-4 rounded-2xl text-black font-bold text-xs"
                                    >
                                        إضافة رابط
                                    </button>
                                    <label className="bg-pink-600 px-4 rounded-2xl text-white font-bold text-xs flex items-center justify-center cursor-pointer hover:bg-pink-500 transition-all">
                                        رفع صورة
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={async (e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    const file = e.target.files[0];
                                                    const formData = new FormData();
                                                    formData.append('image', file);
                                                    
                                                    const loadToast = toast.loading('جاري رفع الصورة...');
                                                    try {
                                                        const res = await api.post('/upload-image', formData, {
                                                            headers: { 'Content-Type': 'multipart/form-data' }
                                                        });
                                                        if (res.data.success) {
                                                            setForm({ ...form, gallery: [...form.gallery, res.data.absolute_url || res.data.url] });
                                                            toast.success('تم رفع الصورة بنجاح', { id: loadToast });
                                                        }
                                                    } catch (err) {
                                                        toast.error('فشل رفع الصورة', { id: loadToast });
                                                    }
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {form.gallery.map((url, idx) => (
                                        <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/20">
                                            <img src={url} className="w-full h-full object-cover" alt="" />
                                            <button 
                                                type="button"
                                                onClick={() => setForm({ ...form, gallery: form.gallery.filter((_, i) => i !== idx) })}
                                                className="absolute inset-0 bg-red-600/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <XCircle size={16} className="text-white" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-cyan-400 text-black font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.3)] mt-4">
                                {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج الآن'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
