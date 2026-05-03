import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Package, Plus, Minus, Search, Info } from 'lucide-react';
import api from '../api/config';
import toast from 'react-hot-toast';

export default function B2BMarket() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchCatalog();
    }, []);

    const fetchCatalog = async () => {
        try {
            const res = await api.get('/crm/catalog');
            setProducts(res.data);
        } catch (err) {
            console.error("Error fetching catalog", err);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product: any) => {
        const existing = cart.find(item => item.product_id === product.id);
        if (existing) {
            setCart(cart.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setCart([...cart, { product_id: product.id, name: product.name, price: product.wholesale_price, quantity: 1 }]);
        }
        toast.success(`تم إضافة ${product.name} للسلة`);
    };

    const removeFromCart = (productId: string) => {
        const existing = cart.find(item => item.product_id === productId);
        if (existing.quantity > 1) {
            setCart(cart.map(item => item.product_id === productId ? { ...item, quantity: item.quantity - 1 } : item));
        } else {
            setCart(cart.filter(item => item.product_id !== productId));
        }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        try {
            // سنرسل الطلب للموردين المعنيين (في الباك إند يتم الربط تلقائياً)
            await api.post('/crm/orders', {
                crm_client_id: 'auto-detect', // في الباك إند سيتم الربط بناءً على التوكين
                items: cart,
                notes: 'طلب من صالون عبر المتجر المباشر'
            });
            toast.success("تم إرسال طلبك بنجاح! سيقوم المورد بالتواصل معك.");
            setCart([]);
        } catch (err) {
            toast.error("فشل إرسال الطلب");
        }
    };

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const filteredProducts = products.filter(p => p.name.includes(searchQuery));

    return (
        <div className="space-y-8 text-right rtl" dir="rtl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">سوق الجملة (B2B Market)</h2>
                    <p className="text-sm text-white/50">اطلب احتياجات صالونك من الموردين مباشرة بأسعار الجملة.</p>
                </div>
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <input 
                        type="text" 
                        placeholder="ابحث عن منتج..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-full py-2 pr-10 pl-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 w-full md:w-64"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Products Grid */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full py-20 text-center">جاري تحميل المنتجات...</div>
                    ) : filteredProducts.map((product, idx) => (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} 
                            animate={{ opacity: 1, scale: 1 }}
                            key={idx} 
                            className="bg-white/5 border border-white/10 rounded-3xl p-5 group hover:border-cyan-500/30 transition-all flex flex-col"
                        >
                            <div className="h-40 bg-black/40 rounded-2xl mb-4 overflow-hidden relative">
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute top-3 left-3 bg-cyan-500 text-black text-[10px] font-black px-2 py-1 rounded">جملة</div>
                            </div>
                            <h3 className="font-bold text-white mb-1">{product.name}</h3>
                            <p className="text-xs text-white/40 mb-4 line-clamp-2">{product.description}</p>
                            <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                                <span className="text-lg font-black text-white">{parseFloat(product.wholesale_price).toLocaleString()} ج.م</span>
                                <button 
                                    onClick={() => addToCart(product)}
                                    className="p-2 bg-white/10 hover:bg-cyan-500 hover:text-black rounded-xl transition-all"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Cart Sidebar */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-fuchsia-600/10 to-cyan-600/10 border border-white/10 rounded-3xl p-6 sticky top-24">
                        <h3 className="font-bold text-white flex items-center gap-2 mb-6">
                            <ShoppingBag className="text-cyan-400" size={20} /> سلة الطلبات
                        </h3>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto mb-6 pr-2">
                            {cart.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-white truncate w-24">{item.name}</p>
                                        <p className="text-[10px] text-white/40">{item.price} ج.م</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => removeFromCart(item.product_id)} className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center hover:bg-red-500/20 text-red-400 transition-all"><Minus size={12} /></button>
                                        <span className="text-xs font-bold text-white">{item.quantity}</span>
                                        <button onClick={() => addToCart({id: item.product_id, name: item.name, wholesale_price: item.price})} className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center hover:bg-green-500/20 text-green-400 transition-all"><Plus size={12} /></button>
                                    </div>
                                </div>
                            ))}
                            {cart.length === 0 && (
                                <div className="text-center py-10">
                                    <Package size={32} className="mx-auto text-white/10 mb-2" />
                                    <p className="text-xs text-white/30">السلة فارغة</p>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-white/10 pt-4 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-white/50">الإجمالي:</span>
                                <span className="text-xl font-black text-cyan-400">{total.toLocaleString()} ج.م</span>
                            </div>
                            <button 
                                onClick={handleCheckout}
                                disabled={cart.length === 0}
                                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black py-3 rounded-2xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:shadow-none"
                            >
                                إرسال الطلب للمورد
                            </button>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-start gap-3">
                        <Info size={16} className="text-fuchsia-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-white/40 leading-relaxed">الأسعار المعروضة هي أسعار الجملة المخصصة للصالونات المشتركة في منصة O2O EG فقط.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
