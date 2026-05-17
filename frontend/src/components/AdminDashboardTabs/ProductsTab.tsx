import React from 'react';
import { Package, Search, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { Product } from '../../types/admin';

interface ProductsTabProps {
    products: Product[];
    productSearch: string;
    setProductSearch: (search: string) => void;
    productFilter: string;
    setProductFilter: (filter: string) => void;
    handleProductStatus: (id: string, status: 'approved' | 'rejected', reason?: string) => void;
    handleDeleteProduct: (id: string) => void;
    productStats: { total: number, pending: number, approved: number, rejected: number };
}

const ProductsTab: React.FC<ProductsTabProps> = ({ 
    products, productSearch, setProductSearch, productFilter, setProductFilter, 
    handleProductStatus, handleDeleteProduct, productStats 
}) => {
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <Package className="text-amber-500" />
                    مخزن المنتجات المركزي
                </h2>
                <div className="flex gap-4">
                    <div className="bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20 text-center">
                        <p className="text-[10px] text-amber-500/60 uppercase">بانتظار المراجعة</p>
                        <p className="text-lg font-black text-amber-500">{productStats.pending}</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 items-center bg-[#121214] p-4 rounded-3xl border border-white/5">
                <Search className="text-white/20" size={20} />
                <input 
                    type="text" 
                    placeholder="بحث في المنتجات..." 
                    className="bg-transparent border-none outline-none text-sm w-full"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                />
                <select 
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none"
                    value={productFilter}
                    onChange={(e) => setProductFilter(e.target.value)}
                >
                    <option value="all">الكل</option>
                    <option value="pending">معلق</option>
                    <option value="approved">مقبول</option>
                    <option value="rejected">مرفوض</option>
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {products.length === 0 ? (
                    <div className="lg:col-span-2 p-20 text-center text-white/20">لا يوجد منتجات تطابق البحث</div>
                ) : products.map(product => (
                    <div key={product.id} className="bg-[#121214] border border-white/5 p-6 rounded-[32px] flex gap-6 items-center group hover:border-white/10 transition-all">
                        <img src={product.image_url || 'https://via.placeholder.com/150'} className="w-24 h-24 rounded-2xl object-cover bg-black" alt="" />
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-lg truncate">{product.name}</h4>
                                    <p className="text-xs text-white/40 mb-2">من: {product.tenant?.name}</p>
                                </div>
                                <span className={`text-[9px] font-bold px-2 py-1 rounded-lg ${
                                    product.status === 'approved' ? 'bg-green-500/10 text-green-400' : 
                                    product.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 
                                    'bg-amber-500/10 text-amber-400'
                                }`}>
                                    {product.status === 'approved' ? 'معروض' : product.status === 'rejected' ? 'مرفوض' : 'بانتظار المراجعة'}
                                </span>
                            </div>
                            <p className="text-xl font-black text-cyan-400">{product.price.toLocaleString()} ج.م</p>
                            <div className="flex gap-2 mt-4">
                                {product.status === 'pending' && (
                                    <>
                                        <button onClick={() => handleProductStatus(product.id, 'approved')} className="flex-1 py-2 bg-green-500 text-black text-[10px] font-black rounded-xl hover:bg-green-400 transition-all flex items-center justify-center gap-1"><CheckCircle size={14} /> موافقة</button>
                                        <button onClick={() => {
                                            const reason = window.prompt('سبب الرفض؟');
                                            if (reason) handleProductStatus(product.id, 'rejected', reason);
                                        }} className="flex-1 py-2 bg-white/5 text-white text-[10px] font-bold rounded-xl border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-1"><XCircle size={14} /> رفض</button>
                                    </>
                                )}
                                <button onClick={() => handleDeleteProduct(product.id)} className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductsTab;
