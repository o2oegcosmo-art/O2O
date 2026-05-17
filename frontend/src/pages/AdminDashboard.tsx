import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/config';
import {
    LayoutDashboard, Users, DollarSign, Calendar,
    Shield, X, FileText,
    Settings, ShoppingBag,
    PieChart, Info, Package,
    UserCheck, MessageSquare
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import WhatsAppAdminPanel from '../components/WhatsAppAdminPanel';
import { motion, AnimatePresence } from 'framer-motion';

// --- Modular Tabs Imports ---
import type { 
    Stats, Lead, Tenant, Article, PaymentRequest, Plan, 
    SupportTicket, Product, AISecurityLog, AffiliateMarket, AdminEvent 
} from '../types/admin';
import OverviewTab from '../components/AdminDashboardTabs/OverviewTab';
import LeadsTab from '../components/AdminDashboardTabs/LeadsTab';
import SalonsTab from '../components/AdminDashboardTabs/SalonsTab';
import CompaniesTab from '../components/AdminDashboardTabs/CompaniesTab';
import B2BAnalyticsTab from '../components/AdminDashboardTabs/B2BAnalyticsTab';
import ContentTab from '../components/AdminDashboardTabs/ContentTab';
import AIShieldTab from '../components/AdminDashboardTabs/AIShieldTab';
import PaymentsTab from '../components/AdminDashboardTabs/PaymentsTab';
import SupportTab from '../components/AdminDashboardTabs/SupportTab';
import PlansTab from '../components/AdminDashboardTabs/PlansTab';
import ProductsTab from '../components/AdminDashboardTabs/ProductsTab';
import AffiliatesTab from '../components/AdminDashboardTabs/AffiliatesTab';

type TabType = 'overview' | 'leads' | 'salons' | 'companies' | 'content' | 'ai_monitor' | 'payments' | 'plans' | 'b2b_analytics' | 'support' | 'products' | 'affiliates' | 'whatsapp' | 'whatsapp_admin';

const AdminDashboard: React.FC = () => {

    const navigate = useNavigate();
    const [stats, setStats] = useState<Stats | null>(null);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [allServices, setAllServices] = useState<{ id: string, name: string, slug: string }[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [events, setEvents] = useState<AdminEvent[]>([]);
    const [payments, setPayments] = useState<PaymentRequest[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [aiSecurityLogs, setAiSecurityLogs] = useState<AISecurityLog[]>([]);
    const [affiliates, setAffiliates] = useState<AffiliateMarket[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Modals & Form States
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [showArticleModal, setShowArticleModal] = useState(false);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [ticketReply, setTicketReply] = useState('');
    const [productSearch, setProductSearch] = useState('');
    const [productFilter, setProductFilter] = useState('all');
    const [productStats, setProductStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [showAddLeadModal, setShowAddLeadModal] = useState(false);
    const [addLeadForm, setAddLeadForm] = useState<{
        name: string, phone: string, governorate: string, 
        interest_type: 'salon' | 'company' | 'affiliate', 
        social_link: string, message: string 
    }>({ name: '', phone: '', governorate: 'القاهرة', interest_type: 'salon', social_link: '', message: '' });

    const [articleForm, setArticleForm] = useState({ title: '', category: 'أخبار الذكاء الاصطناعي', content: '', image: '', author: 'إدارة O2OEG' });
    const [planForm, setPlanForm] = useState({ name: '', price: 0, description: '', services: [] as string[] });
    
    // --- O2OEG Secure Shield States ---
    const [isWhatsAppAdminAuthorized, setIsWhatsAppAdminAuthorized] = useState(false);
    const [shieldPassword, setShieldPassword] = useState('');
    const [shieldError, setShieldError] = useState(false);

    // --- Actions ---
    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        const endpoints = [
            { key: 'stats', url: '/admin/stats', setter: setStats },
            { key: 'leads', url: '/admin/leads', setter: (data: { data?: Lead[] } | Lead[]) => setLeads(Array.isArray(data) ? data : (data.data || [])) },
            { key: 'tenants', url: '/admin/tenant-services', setter: (data: { data?: Tenant[] } | Tenant[]) => setTenants(Array.isArray(data) ? data : (data.data || [])) },
            { key: 'services', url: '/admin/services', setter: (data: { data?: any[] } | any[]) => setAllServices(Array.isArray(data) ? data : (data.data || [])) },
            { key: 'articles', url: '/articles', setter: (data: { data?: Article[] } | Article[]) => setArticles(Array.isArray(data) ? data : (data.data || [])) },
            { key: 'payments', url: '/admin/payments/pending', setter: (data: { data?: PaymentRequest[] } | PaymentRequest[]) => setPayments(Array.isArray(data) ? data : (data.data || [])) },
            { key: 'plans', url: '/plans', setter: (data: { data?: Plan[] } | Plan[]) => setPlans(Array.isArray(data) ? data : (data.data || [])) },
            { key: 'support', url: '/admin/support-tickets', setter: (data: { data?: SupportTicket[] } | SupportTicket[]) => setSupportTickets(Array.isArray(data) ? data : (data.data || [])) },
            { key: 'events', url: '/admin/all-events', setter: (data: { data?: AdminEvent[] } | AdminEvent[]) => setEvents(Array.isArray(data) ? data : (data.data || [])) },
            { key: 'products', url: '/admin/products?status=pending', setter: (data: { data?: Product[] } | Product[]) => setProducts(Array.isArray(data) ? (data as any) : (data.data || [])) },
            { key: 'productStats', url: '/admin/products/stats', setter: (data: any) => setProductStats(data || { total: 0, pending: 0, approved: 0, rejected: 0 }) },
            { key: 'aiLogs', url: '/admin/ai-security/logs', setter: (data: AISecurityLog[]) => setAiSecurityLogs(data || []) },
            { key: 'affiliates', url: '/admin/affiliates', setter: (data: { data?: AffiliateMarket[] } | AffiliateMarket[]) => setAffiliates(Array.isArray(data) ? (data as any) : (data.data || [])) },
        ];
        try {
            await Promise.all(endpoints.map(endpoint => 
                api.get(endpoint.url).then(res => endpoint.setter(res.data)).catch(err => console.error(`Fetch ${endpoint.key} failed:`, err))
            ));
        } catch (err) {
            toast.error("فشل في جلب البيانات المركزية");
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(false);
    }, [fetchData]);

    const handleToggleService = useCallback(async (tenantId: string, serviceSlug: string, isCurrentlyEnabled: boolean) => {
        try {
            const action = isCurrentlyEnabled ? 'disable' : 'enable';
            await api.post('/admin/tenant-services/toggle', { tenant_id: tenantId, service_slug: serviceSlug, action });
            toast.success(action === 'enable' ? 'تم تفعيل الخدمة' : 'تم تعطيل الخدمة');
            fetchData(true);
        } catch { toast.error("خطأ في المعالجة"); }
    }, [fetchData]);

    const handleLeadStatusUpdate = useCallback(async (leadId: string, newStatus: 'accepted' | 'rejected') => {
        const loadingToast = toast.loading('جاري تحديث الحالة...');
        try {
            await api.post(`/admin/leads/${leadId}/status`, { status: newStatus });
            toast.dismiss(loadingToast);
            toast.success('تم التحديث بنجاح ✅');
            fetchData();
        } catch (error: any) {
            toast.dismiss(loadingToast);
            toast.error(error.response?.data?.message || 'حدث خطأ');
        }
    }, [fetchData]);

    const handleDeleteLead = useCallback(async (id: string) => {
        if (!window.confirm('هل أنت متأكد؟')) return;
        try {
            await api.post(`/admin/leads/${id}`, { _method: 'DELETE' });
            toast.success('تم الحذف');
            fetchData();
        } catch { toast.error('فشل في الحذف'); }
    }, [fetchData]);

    const handleAddLeadSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/leads', addLeadForm);
            toast.success("تم الإضافة");
            setShowAddLeadModal(false);
            setAddLeadForm({ name: '', phone: '', governorate: 'القاهرة', interest_type: 'salon', social_link: '', message: '' });
            fetchData();
        } catch { toast.error("خطأ في الإضافة"); }
    }, [addLeadForm, fetchData]);

    const handleArticleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/articles', articleForm);
            toast.success("تم النشر");
            setShowArticleModal(false);
            fetchData();
        } catch { toast.error("خطأ في النشر"); }
    }, [articleForm, fetchData]);

    const handleDeleteArticle = useCallback(async (id: string) => {
        if (!window.confirm('حذف المقال؟')) return;
        try {
            await api.delete(`/articles/${id}`);
            toast.success('تم الحذف');
            fetchData();
        } catch { toast.error('خطأ في الحذف'); }
    }, [fetchData]);

    const handleVerifyPayment = useCallback(async (id: string, status: 'approved' | 'rejected') => {
        try {
            await api.patch(`/admin/payments/${id}/verify`, { status });
            toast.success("تم التحديث");
            fetchData();
        } catch { toast.error("خطأ"); }
    }, [fetchData]);

    const handlePlanSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPlan) await api.put(`/admin/plans/${editingPlan.id}`, planForm);
            else await api.post('/admin/plans', planForm);
            toast.success("تم الحفظ");
            setShowPlanModal(false);
            fetchData();
        } catch { toast.error("خطأ"); }
    }, [editingPlan, planForm, fetchData]);

    const handleTicketAction = useCallback(async (id: string, status: string) => {
        try {
            await api.patch(`/admin/support-tickets/${id}`, { status, reply: ticketReply });
            toast.success("تم التحديث");
            setShowTicketModal(false);
            setTicketReply('');
            fetchData();
        } catch { toast.error("خطأ"); }
    }, [ticketReply, fetchData]);

    const fetchCompanyStats = useCallback(async (id: string) => {
        try {
            // TODO: Implement Company Stats Modal in UI
            await api.get(`/admin/companies/${id}/stats`);
            toast.success("تم جلب إحصائيات الشركة (جاري تطوير واجهة العرض)");
        } catch { toast.error("خطأ في جلب البيانات"); }
    }, []);

    const handleUpdateEventStatus = useCallback(async (id: string, status: 'active' | 'rejected' | 'pending') => {
        try {
            await api.patch(`/admin/events/${id}/status`, { status });
            toast.success("تم التحديث");
            fetchData();
        } catch { toast.error("خطأ"); }
    }, [fetchData]);

    const handleProductStatus = useCallback(async (id: string, status: 'approved' | 'rejected', reason?: string) => {
        try {
            await api.patch(`/admin/products/${id}/status`, { status, rejection_reason: reason });
            toast.success("تم التحديث");
            fetchData();
        } catch { toast.error("خطأ"); }
    }, [fetchData]);

    const handleDeleteProduct = useCallback(async (id: string) => {
        if (!window.confirm('حذف نهائي؟')) return;
        try {
            await api.delete(`/admin/products/${id}`);
            toast.success('تم الحذف');
            fetchData();
        } catch { toast.error('خطأ'); }
    }, [fetchData]);

    const handleToggleTenantStatus = useCallback(async (id: string) => {
        try {
            await api.patch(`/admin/tenants/${id}/toggle-status`);
            toast.success("تم تغيير الحالة");
            fetchData();
        } catch { toast.error("خطأ"); }
    }, [fetchData]);

    const handleVerifyShield = useCallback(() => {
        const MASTER_KEY = 'O2OEG_Secure_Shield_2026_#646';
        if (shieldPassword === MASTER_KEY) {
            setIsWhatsAppAdminAuthorized(true);
            setShieldError(false);
            toast.success('تم التحقق بنجاح .. مرحباً بك في درع الحماية 🛡️');
        } else {
            setShieldError(true);
            toast.error('كلمة المرور غير صحيحة! الوصول مرفوض.');
        }
    }, [shieldPassword]);

    const handleLogout = useCallback(() => {
        // 🛡️ Multi-Session Strategy: Only clear admin-specific data
        localStorage.removeItem('o2oeg_token_admin');
        localStorage.removeItem('o2oeg_user_admin');
        sessionStorage.removeItem('o2oeg_token_admin');
        sessionStorage.removeItem('o2oeg_user_admin');
        
        // Also clear global if we want, but keeping it might be safer for other tabs
        // localStorage.clear(); // REMOVED to support multi-session
        
        navigate('/login');
    }, [navigate]);

    const salons = useMemo(() => (Array.isArray(tenants) ? tenants.filter(t => t.business_category === 'salon') : []), [tenants]);
    const companies = useMemo(() => (Array.isArray(tenants) ? tenants.filter(t => t.business_category === 'company') : []), [tenants]);

    if (loading && !stats) return (
        <div className="flex items-center justify-center h-screen bg-[#0A0A0C] text-white">
            <div className="w-12 h-12 border-4 border-fuchsia-500/20 border-t-fuchsia-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0A0A0C] text-white flex flex-col md:flex-row rtl font-sans" dir="rtl">
            <Toaster position="bottom-right" />
            
            <aside className={`fixed inset-y-0 right-0 w-72 bg-[#121214] border-l border-white/5 p-6 flex flex-col gap-8 h-screen overflow-y-auto z-50 transition-transform duration-300 md:static md:translate-x-0 ${isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div onClick={() => navigate('/')} className="flex items-center justify-between gap-3 px-2 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-fuchsia-600 to-cyan-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-fuchsia-600/20">O</div>
                        <div>
                            <h1 className="font-black tracking-tight text-lg">O2OEG Control</h1>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest">Super Admin v2.0</p>
                        </div>
                    </div>
                    <button onClick={() => setIsMobileSidebarOpen(false)} className="md:hidden text-white/50 hover:text-white"><X size={20} /></button>
                </div>

                <nav className="flex flex-col gap-1">
                    {[
                        { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
                        { id: 'leads', label: 'المهتمين (Leads)', icon: Users },
                        { id: 'salons', label: 'إدارة الصالونات', icon: Calendar },
                        { id: 'companies', label: 'إدارة الشركات', icon: ShoppingBag },
                        { id: 'b2b_analytics', label: 'إحصائيات B2B', icon: PieChart },
                        { id: 'content', label: 'إدارة المحتوى', icon: FileText },
                        { id: 'ai_monitor', label: 'مراقب AI Shield', icon: Shield },
                        { id: 'payments', label: 'طلبات الدفع', icon: DollarSign },
                        { id: 'support', label: 'الدعم الفني', icon: Info },
                        { id: 'plans', label: 'الباقات والأسعار', icon: Settings },
                        { id: 'products', label: 'مخزن المنتجات المركزي', icon: Package },
                        { id: 'affiliates', label: 'إدارة المسوقين', icon: UserCheck },
                        { id: 'whatsapp', label: 'ربط الواتساب (الإدارة)', icon: MessageSquare },
                    ].map((item) => (
                        <button key={item.id} onClick={() => { setActiveTab(item.id as TabType); setIsMobileSidebarOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${activeTab === item.id ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>
                            <item.icon size={18} />
                            <span className="text-sm font-bold">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="mt-auto p-4 bg-white/5 rounded-3xl border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-black font-bold">M</div>
                        <div className="text-[10px]">
                            <p className="text-white font-bold">Mahmoud William</p>
                            <p className="text-white/40">المدير العام</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full py-2 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">تسجيل الخروج</button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto relative bg-[#0A0A0C] h-screen w-full">
                <div className="md:hidden flex items-center justify-between p-4 bg-[#121214] border-b border-white/5 sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-fuchsia-600 to-cyan-600 rounded-lg flex items-center justify-center font-black text-sm">O</div>
                        <h1 className="font-black text-sm">O2OEG Control</h1>
                    </div>
                    <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 bg-white/5 rounded-lg text-white">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                </div>

                <div className="p-4 md:p-12">
                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="max-w-6xl mx-auto space-y-8">
                            {activeTab === 'overview' && stats && <OverviewTab stats={stats} fetchData={fetchData} />}
                            {activeTab === 'leads' && <LeadsTab leads={leads} setShowAddLeadModal={setShowAddLeadModal} handleLeadStatusUpdate={handleLeadStatusUpdate} handleDeleteLead={handleDeleteLead} />}
                            {activeTab === 'salons' && <SalonsTab salons={salons} handleToggleTenantStatus={handleToggleTenantStatus} setSelectedTenant={setSelectedTenant} setShowServiceModal={setShowServiceModal} />}
                            {activeTab === 'companies' && <CompaniesTab companies={companies} handleToggleTenantStatus={handleToggleTenantStatus} fetchCompanyStats={fetchCompanyStats} />}
                            {activeTab === 'b2b_analytics' && stats && <B2BAnalyticsTab stats={stats} />}
                            {activeTab === 'content' && <ContentTab articles={articles} events={events} setShowArticleModal={setShowArticleModal} handleDeleteArticle={handleDeleteArticle} handleUpdateEventStatus={handleUpdateEventStatus} />}
                            {activeTab === 'ai_monitor' && stats && <AIShieldTab stats={stats} aiSecurityLogs={aiSecurityLogs} />}
                            {activeTab === 'payments' && <PaymentsTab payments={payments} handleVerifyPayment={handleVerifyPayment} />}
                            {activeTab === 'support' && <SupportTab supportTickets={supportTickets} setSelectedTicket={setSelectedTicket} setShowTicketModal={setShowTicketModal} />}
                            {activeTab === 'plans' && <PlansTab plans={plans} setEditingPlan={setEditingPlan} setPlanForm={setPlanForm} setShowPlanModal={setShowPlanModal} />}
                            {activeTab === 'products' && <ProductsTab products={products} productSearch={productSearch} setProductSearch={setProductSearch} productFilter={productFilter} setProductFilter={setProductFilter} handleProductStatus={handleProductStatus} handleDeleteProduct={handleDeleteProduct} productStats={productStats} />}
                            {activeTab === 'affiliates' && <AffiliatesTab affiliates={affiliates} />}
                        </motion.div>

                        {activeTab === 'whatsapp' && (
                            <motion.div key="whatsapp" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-md mx-auto">
                                <div className="bg-[#121214] border border-white/10 rounded-[40px] p-8 text-center space-y-6">
                                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-green-500/20">
                                        <MessageSquare size={40} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-2">مدير واتساب المركزي</h3>
                                        <p className="text-sm text-white/40 leading-relaxed">تحكم في جسر التواصل، راقب الرسائل الصادرة والواردة، وقم بربط الأنظمة يدوياً عند الحاجة.</p>
                                    </div>
                                    <button onClick={() => setActiveTab('whatsapp_admin')} className="w-full py-4 bg-green-500 text-black font-black rounded-2xl hover:bg-green-400 transition-all shadow-xl shadow-green-500/10">فتح لوحة التحكم المتقدمة</button>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'whatsapp_admin' && (
                            <motion.div key="whatsapp_admin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <header className="flex items-center gap-4">
                                    <button onClick={() => { setActiveTab('whatsapp'); setIsWhatsAppAdminAuthorized(false); setShieldPassword(''); }} className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all"><X size={20} /></button>
                                    <h2 className="text-2xl font-bold">إدارة جسر الواتساب (Bridge Admin)</h2>
                                </header>
                                
                                {!isWhatsAppAdminAuthorized ? (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto py-12">
                                        <div className="bg-[#121214] border border-white/10 rounded-[40px] p-10 text-center space-y-8 shadow-2xl shadow-fuchsia-600/5 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent opacity-50" />
                                            
                                            <div className="w-24 h-24 bg-fuchsia-600/10 rounded-3xl mx-auto flex items-center justify-center border border-fuchsia-500/20 relative group">
                                                <Shield size={48} className="text-fuchsia-500 group-hover:scale-110 transition-transform duration-500" />
                                                <div className="absolute inset-0 bg-fuchsia-500/20 blur-2xl rounded-full scale-50 group-hover:scale-100 transition-transform duration-500" />
                                            </div>

                                            <div>
                                                <h3 className="text-2xl font-black mb-2">درع الحماية الرقمي</h3>
                                                <p className="text-sm text-white/40 leading-relaxed">منطقة محظورة. يرجى إدخال مفتاح التشفير المركزي للوصول إلى جسر البيانات.</p>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="relative">
                                                    <input 
                                                        type="password" 
                                                        value={shieldPassword}
                                                        onChange={(e) => { setShieldPassword(e.target.value); setShieldError(false); }}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleVerifyShield()}
                                                        placeholder="إدخال مفتاح العبور..." 
                                                        className={`w-full bg-white/5 border ${shieldError ? 'border-red-500' : 'border-white/10'} rounded-2xl px-6 py-4 text-center text-xl tracking-widest focus:outline-none focus:border-fuchsia-500 transition-all font-mono`}
                                                    />
                                                    {shieldError && (
                                                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-[10px] mt-2 font-bold">⚠️ عذراً، المفتاح الذي أدخلته غير مطابق لسجلاتنا الأمنية.</motion.p>
                                                    )}
                                                </div>
                                                <button 
                                                    onClick={handleVerifyShield}
                                                    className="w-full py-4 bg-fuchsia-600 text-white font-black rounded-2xl hover:bg-fuchsia-500 transition-all shadow-xl shadow-fuchsia-600/20 flex items-center justify-center gap-3"
                                                >
                                                    <UserCheck size={20} />
                                                    تأكيد الهوية الرقمية
                                                </button>
                                            </div>
                                            
                                            <p className="text-[10px] text-white/20 uppercase tracking-[0.3em]">O2OEG Secure Shield v2.0</p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <WhatsAppAdminPanel />
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <AnimatePresence>
                {showServiceModal && selectedTenant && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowServiceModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-3xl bg-[#121214] border border-white/10 rounded-[32px] md:rounded-[40px] p-6 md:p-10 shadow-2xl overflow-hidden">
                            <button onClick={() => setShowServiceModal(false)} className="absolute top-6 left-6 md:top-8 md:left-8 text-white/20 hover:text-white transition-all"><X size={24} /></button>
                            <h3 className="text-2xl md:text-3xl font-black mb-6 md:mb-8 text-right">تعديل موديولات {selectedTenant.name}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                                {allServices.map(service => {
                                    const isEnabled = (selectedTenant.services || []).some(s => s.slug === service.slug);
                                    return (
                                        <div key={service.id} className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5 hover:border-white/10 transition-all">
                                            <span className="font-bold text-sm">{service.name}</span>
                                            <button onClick={() => handleToggleService(selectedTenant.id, service.slug, isEnabled)} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black transition-all shadow-lg ${isEnabled ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-green-500 text-black shadow-green-500/20'}`}>{isEnabled ? 'تعطيل' : 'تفعيل'}</button>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </div>
                )}
                {showArticleModal && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowArticleModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md bg-[#121214] border border-white/10 rounded-[32px] md:rounded-[40px] p-6 md:p-8">
                            <button onClick={() => setShowArticleModal(false)} className="absolute top-6 left-6 text-white/20 hover:text-white transition-all"><X size={20} /></button>
                            <h3 className="text-2xl font-bold mb-6 text-right">نشر مقال جديد</h3>
                            <form onSubmit={handleArticleSubmit} className="space-y-4">
                                <input required placeholder="عنوان المقال" value={articleForm.title} onChange={e => setArticleForm({ ...articleForm, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-fuchsia-500" />
                                <textarea required placeholder="محتوى المقال" value={articleForm.content} onChange={e => setArticleForm({ ...articleForm, content: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 h-40 focus:outline-none focus:border-fuchsia-500" />
                                <button type="submit" className="w-full bg-fuchsia-600 text-white font-black py-4 rounded-2xl hover:bg-fuchsia-500 transition-all shadow-lg shadow-fuchsia-600/20">نشر الآن</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default AdminDashboard;
