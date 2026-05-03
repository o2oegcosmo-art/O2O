import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/config';
import {
    LayoutDashboard, Users, DollarSign, TrendingUp, Calendar,
    Shield, X, Clock, FileText,
    Settings, Plus, ShoppingBag,
    PieChart, Info, Package, CheckCircle, XCircle, Search, Trash2,
    UserCheck, Link, Banknote
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// --- Static Data ---
// Removed static ALL_SERVICES as we now fetch them from the backend for integrity.

// --- Interfaces ---
interface Stats {
    mrr: number;
    totalRevenue: number;
    activeSubscriptions: number;
    leadsCount: number;
    salonsCount: number;
    companiesCount: number;
    b2bStats: {
        totalOrders: number;
        totalValue: number;
    };
    growthData: number[];
    aiStats?: {
        totalMessages: number;
        spamAlerts: number;
        aiSuccessRate: number;
        usageByTenant: { name: string, messages: number, status: string, category?: string }[];
        hallucinationAlerts: number;
    }
}

interface PaymentRequest {
    id: string;
    amount: number;
    status: string;
    created_at: string;
    receipt_path: string | null;
    sender_phone: string | null;
    tenant: { name: string };
    subscription?: { plan?: { name: string } };
}

interface Lead {
    id: string;
    name: string;
    phone: string;
    governorate: string;
    interest_type: string;
    created_at: string;
}

interface Tenant {
    id: string;
    name: string;
    domain: string;
    status: string;
    business_category: string;
    logo_url?: string;
    services: { id: string, name: string, slug: string }[];
}

interface Article {
    id: string;
    title: string;
    category: string;
    content: string;
    image_url: string;
    views?: number;
    created_at: string;
}

interface AdminEvent {
    id: string;
    title: string;
    clicks: number;
}

interface Plan {
    id: string;
    name: string;
    price: number;
    description: string;
    services?: { id: string, name: string }[];
}

interface SupportTicket {
    id: string;
    salon: string;
    subject: string;
    status: 'pending' | 'open' | 'resolved';
    priority: 'high' | 'medium' | 'low';
    date: string;
}

type TabType = 'overview' | 'leads' | 'salons' | 'companies' | 'content' | 'ai_monitor' | 'payments' | 'plans' | 'b2b_analytics' | 'support' | 'products' | 'affiliates';

interface AffiliateMarket {
    id: string;
    promo_code: string;
    commission_percentage: number;
    balance: number;
    total_earned: number;
    status: string;
    user: { name: string; email: string; phone: string };
    clicks_count?: number;
    referred_tenants_count?: number;
}

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason?: string;
    image_url?: string;
    created_at: string;
    tenant: { id: string; name: string; domain: string };
}

interface AISecurityLog {
    id: number;
    tenant_name: string;
    feature: string;
    model: string;
    prompt_sent: string;
    response_received: string;
    is_hallucination: boolean;
    security_flags: string;
    created_at: string;
}

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
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [ticketReply, setTicketReply] = useState('');
    const [showCompanyStatsModal, setShowCompanyStatsModal] = useState(false);
    const [selectedCompanyStats, setSelectedCompanyStats] = useState<any>(null);
    const [productSearch, setProductSearch] = useState('');
    const [productFilter, setProductFilter] = useState('all');
    const [productStats, setProductStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

    const [articleForm, setArticleForm] = useState({ title: '', category: 'أخبار الذكاء الاصطناعي', content: '', image: '', author: 'إدارة O2OEG' });
    const [planForm, setPlanForm] = useState({ name: '', price: 0, description: '', services: [] as string[] });

    const didFetch = useRef(false);

    // --- Actions ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        
        const endpoints = [
            { key: 'stats', url: '/admin/stats', setter: setStats },
            { key: 'leads', url: '/admin/leads', setter: (data: any) => setLeads(Array.isArray(data) ? data : (data.data || [])) },
            { key: 'tenants', url: '/admin/tenant-services', setter: (data: any) => setTenants(Array.isArray(data) ? data : (data.data || [])) },
            { key: 'services', url: '/admin/services', setter: (data: any) => setAllServices(Array.isArray(data) ? data : (data.data || [])) },
            { key: 'articles', url: '/articles', setter: (data: any) => setArticles(Array.isArray(data) ? data : (data.data || [])) },
            { key: 'payments', url: '/admin/payments/pending', setter: (data: any) => setPayments(Array.isArray(data) ? data : (data.data || [])) },
            { key: 'plans', url: '/plans', setter: (data: any) => setPlans(Array.isArray(data) ? data : (data.data || [])) },
            { key: 'support', url: '/admin/support-tickets', setter: (data: any) => setSupportTickets(Array.isArray(data) ? data : (data.data || [])) },
            { key: 'events', url: '/admin/all-events', setter: (data: any) => setEvents(Array.isArray(data) ? data : (data.data || [])) },
            { key: 'products', url: '/admin/products?status=pending', setter: (data: any) => setProducts(data?.data || data || []) },
            { key: 'productStats', url: '/admin/products/stats', setter: (data: any) => setProductStats(data || { total: 0, pending: 0, approved: 0, rejected: 0 }) },
            { key: 'aiLogs', url: '/admin/ai-security/logs', setter: (data: any) => setAiSecurityLogs(data || []) },
            { key: 'affiliates', url: '/admin/affiliates', setter: (data: any) => setAffiliates(data?.data || data || []) },
        ];

        try {
            await Promise.all(endpoints.map(endpoint => 
                api.get(endpoint.url)
                    .then(res => {
                        if (res.data && res.data.error) {
                            console.warn(`Partial error in ${endpoint.key}:`, res.data.error);
                            // If the backend returns an explicit error but also partial data, we still set it
                        }
                        endpoint.setter(res.data);
                    })
                    .catch(err => {
                        console.error(`CRITICAL: Failed to fetch ${endpoint.key}:`, err);
                        const msg = err.response?.data?.message || err.message;
                        toast.error(`فشل في جلب ${endpoint.key}: ${msg}`, { id: `err-${endpoint.key}` });
                    })
            ));
        } catch (err) {
            toast.error("فشل في جلب بيانات الإدارة المركزية");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!didFetch.current) {
            fetchData();
            didFetch.current = true;
        }
    }, [fetchData]);

    const handleToggleService = useCallback(async (tenantId: string, serviceSlug: string, isCurrentlyEnabled: boolean) => {
        try {
            const action = isCurrentlyEnabled ? 'disable' : 'enable';
            await api.post('/admin/tenant-services/toggle', { tenant_id: tenantId, service_slug: serviceSlug, action });
            toast.success(action === 'enable' ? 'تم تفعيل الخدمة' : 'تم تعطيل الخدمة');
            const res = await api.get('/admin/tenant-services');
            const updatedTenants = Array.isArray(res.data) ? res.data : (res.data.data || []);
            setTenants(updatedTenants);
            if (selectedTenant?.id === tenantId) setSelectedTenant(updatedTenants.find((t: Tenant) => t.id === tenantId) || null);
        } catch { toast.error("خطأ في المعالجة"); }
    }, [selectedTenant]);

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
        if (!window.confirm('هل أنت متأكد من حذف هذا المقال؟')) return;
        try {
            await api.delete(`/articles/${id}`);
            toast.success('تم حذف المقال');
            fetchData();
        } catch { toast.error('خطأ في الحذف'); }
    }, [fetchData]);

    const handleVerifyPayment = useCallback(async (id: string, status: 'approved' | 'rejected') => {
        try {
            await api.patch(`/admin/payments/${id}/verify`, { status });
            toast.success(status === 'approved' ? "تم التفعيل!" : "تم الرفض");
            fetchData();
        } catch { toast.error("خطأ في المعالجة"); }
    }, [fetchData]);


    const handlePlanSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPlan) await api.put(`/admin/plans/${editingPlan.id}`, planForm);
            else await api.post('/admin/plans', planForm);
            toast.success("تم الحفظ");
            setShowPlanModal(false);
            fetchData();
        } catch { toast.error("خطأ في الحفظ"); }
    }, [editingPlan, planForm, fetchData]);

    const handleTicketAction = useCallback(async (id: string, status: string) => {
        try {
            await api.patch(`/admin/support-tickets/${id}`, { status, reply: ticketReply });
            toast.success("تم تحديث حالة التذكرة");
            setShowTicketModal(false);
            setTicketReply('');
            fetchData();
        } catch { toast.error("خطأ في تحديث التذكرة"); }
    }, [ticketReply, fetchData]);

    const fetchCompanyStats = useCallback(async (id: string) => {
        try {
            const res = await api.get(`/admin/companies/${id}/stats`);
            setSelectedCompanyStats(res.data);
            setShowCompanyStatsModal(true);
        } catch {
            toast.error("فشل في جلب إحصائيات الشركة");
        }
    }, []);

    const handleUpdateEventStatus = useCallback(async (id: string, status: 'active' | 'rejected' | 'pending') => {
        try {
            await api.patch(`/admin/events/${id}/status`, { status });
            toast.success(status === 'active' ? "تم التنشيط والظهور للمستخدمين" : "تم تحديث الحالة");
            fetchData();
        } catch {
            toast.error("فشل في تحديث حالة الفعالية");
        }
    }, [fetchData]);

    const handleProductStatus = useCallback(async (id: string, status: 'approved' | 'rejected', reason?: string) => {
        try {
            await api.patch(`/admin/products/${id}/status`, { status, rejection_reason: reason });
            toast.success(status === 'approved' ? '✅ تمت الموافقة على المنتج' : '❌ تم رفض المنتج');
            fetchData();
        } catch { toast.error('خطأ في تحديث المنتج'); }
    }, [fetchData]);

    const handleDeleteProduct = useCallback(async (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا المنتج نهائياً؟')) return;
        try {
            await api.delete(`/admin/products/${id}`);
            toast.success('تم حذف المنتج نهائياً');
            fetchData();
        } catch { toast.error('خطأ في الحذف'); }
    }, [fetchData]);

    const handleToggleTenantStatus = useCallback(async (id: string, currentStatus: string) => {
        try {
            await api.patch(`/admin/tenants/${id}/toggle-status`);
            toast.success(currentStatus === 'active' ? 'تم إيقاف الحساب' : 'تم تفعيل الحساب');
            fetchData();
        } catch { toast.error('خطأ في تغيير حالة الحساب'); }
    }, [fetchData]);

    const salons = useMemo(() => (Array.isArray(tenants) ? tenants.filter(t => t.business_category === 'salon') : []), [tenants]);
    const companies = useMemo(() => (Array.isArray(tenants) ? tenants.filter(t => t.business_category === 'company') : []), [tenants]);

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-[#0A0A0C] text-white">
            <div className="w-12 h-12 border-4 border-fuchsia-500/20 border-t-fuchsia-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0A0A0C] text-white flex flex-col md:flex-row rtl font-sans" dir="rtl">
            <Toaster position="bottom-right" />

            {/* Mobile Sidebar Overlay */}
            {isMobileSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 right-0 w-72 bg-[#121214] border-l border-white/5 p-6 flex flex-col gap-8 h-screen overflow-y-auto z-50 transition-transform duration-300 md:static md:translate-x-0 ${isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div onClick={() => navigate('/')} className="flex items-center justify-between gap-3 px-2 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-fuchsia-600 to-cyan-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-fuchsia-600/20">O</div>
                        <div>
                            <h1 className="font-black tracking-tight text-lg">O2OEG Control</h1>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest">Super Admin v2.0</p>
                        </div>
                    </div>
                    <button onClick={() => setIsMobileSidebarOpen(false)} className="md:hidden text-white/50 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
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
                    <button className="w-full py-2 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">تسجيل الخروج</button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative bg-[#0A0A0C] h-screen w-full">
                {/* Mobile Header */}
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

                        {activeTab === 'overview' && stats && (
                            <div className="space-y-8">
                                <header className="flex justify-between items-center">
                                    <h2 className="text-3xl font-black tracking-tight">مؤشرات الأداء المركزية</h2>
                                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] text-white/40 flex items-center gap-2"><Clock size={14} /> آخر تحديث: {new Date().toLocaleTimeString('ar-EG')}</div>
                                </header>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { label: 'MRR المتوقع', value: (stats?.mrr ?? 0).toLocaleString() + ' ج.م', icon: TrendingUp, color: 'text-cyan-400' },
                                        { label: 'إجمالي المبيعات', value: (stats?.totalRevenue ?? 0).toLocaleString() + ' ج.م', icon: DollarSign, color: 'text-fuchsia-400' },
                                        { label: 'الصالونات النشطة', value: stats?.salonsCount ?? 0, icon: Calendar, color: 'text-amber-400' },
                                        { label: 'الشركات المتعاقدة', value: stats?.companiesCount ?? 0, icon: ShoppingBag, color: 'text-green-400' },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-[#121214] border border-white/5 p-6 rounded-[32px] hover:border-white/10 transition-all">
                                            <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 ${stat.color}`}><stat.icon size={20} /></div>
                                            <p className="text-xs text-white/40 mb-1">{stat.label}</p>
                                            <h3 className="text-2xl font-black">{stat.value}</h3>
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 bg-[#121214] border border-white/5 p-8 rounded-[40px]">
                                        <h3 className="font-bold mb-6 text-lg">نمو المهتمين (Leads Growth)</h3>
                                        <div className="h-64 flex items-end justify-between gap-2">
                                            {(stats?.growthData || []).map((h, i) => (
                                                <div key={i} className="flex-1 bg-gradient-to-t from-fuchsia-600/20 to-fuchsia-500 rounded-t-lg opacity-60 hover:opacity-100 transition-all" style={{ height: `${h}%` }}></div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-br from-fuchsia-600/10 to-cyan-600/10 border border-white/10 p-8 rounded-[40px] flex flex-col justify-center text-center">
                                        <h3 className="text-xl font-bold mb-4">Command Center v2.0</h3>
                                        <p className="text-sm text-white/50 leading-relaxed">أهلاً بك يا سيادة القائد. تم تفعيل كافة الصلاحيات وأنظمة المراقبة الذكية بنجاح.</p>
                                        <button className="mt-8 bg-white text-black font-black py-4 rounded-2xl hover:scale-105 transition-transform active:scale-95 shadow-xl">تصدير التقرير</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'leads' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold">إدارة المهتمين</h2>
                                
                                {/* Mobile View: Cards */}
                                <div className="md:hidden space-y-4">
                                    {leads.map(lead => (
                                        <div key={lead.id} className="bg-[#121214] border border-white/5 p-4 rounded-[24px] space-y-3">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-bold text-base">{lead.name}</h3>
                                                <span className={`px-2 py-1 rounded-lg text-[9px] font-bold ${lead.interest_type === 'salon' ? 'bg-fuchsia-500/10 text-fuchsia-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                                                    {lead.interest_type === 'salon' ? 'صالون' : 'شركة'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-white/40">الموبايل:</span>
                                                <span className="font-mono text-cyan-400" dir="ltr">{lead.phone}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-white/40">المحافظة:</span>
                                                <span className="text-white/60">{lead.governorate}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {leads.length === 0 && <p className="text-center text-white/20 py-8">لا يوجد مهتمين حالياً</p>}
                                </div>

                                {/* Desktop View: Table */}
                                <div className="hidden md:block bg-[#121214] border border-white/5 rounded-[32px] overflow-hidden">
                                    <table className="w-full text-right">
                                        <thead className="bg-white/5 border-b border-white/5">
                                            <tr><th className="p-6">الاسم</th><th className="p-6">الموبايل</th><th className="p-6">المحافظة</th><th className="p-6">النوع</th></tr>
                                        </thead>
                                        <tbody>
                                            {leads.map(lead => (
                                                <tr key={lead.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                                    <td className="p-6 font-bold">{lead.name}</td>
                                                    <td className="p-6 font-mono text-cyan-400" dir="ltr">{lead.phone}</td>
                                                    <td className="p-6 text-white/60">{lead.governorate}</td>
                                                    <td className="p-6"><span className={`px-2 py-1 rounded-lg text-[9px] font-bold ${lead.interest_type === 'salon' ? 'bg-fuchsia-500/10 text-fuchsia-400' : 'bg-cyan-500/10 text-cyan-400'}`}>{lead.interest_type === 'salon' ? 'صالون' : 'شركة'}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'salons' && (
                            <div className="space-y-6">
                                <header className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-2xl font-bold">إدارة الصالونات</h2>
                                        <p className="text-sm text-white/40 mt-1">{salons.length} صالون مسجل في المنصة</p>
                                    </div>
                                </header>

                                {salons.length === 0 ? (
                                    <div className="p-20 bg-[#121214] rounded-[40px] border border-white/5 text-center">
                                        <p className="text-white/20 text-sm">لا يوجد صالونات مسجلة حتى الآن</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {salons.map(salon => {
                                            const activeCount = salon.services?.length || 0;

                                            return (
                                                <div key={salon.id} className="bg-[#121214] border border-white/5 p-6 rounded-[32px] hover:border-fuchsia-500/20 transition-all group">
                                                    {/* Header */}
                                                    <div className="flex justify-between items-start mb-5">
                                                        <div>
                                                            <h3 className="font-bold text-lg text-white">{salon.name}</h3>
                                                            <p className="text-xs text-white/30 mt-0.5 font-mono">{salon.domain}</p>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleToggleTenantStatus(salon.id, salon.status)}
                                                            className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all cursor-pointer ${
                                                                salon.status === 'active' 
                                                                    ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500 hover:text-black' 
                                                                    : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white'
                                                            }`}>
                                                            {salon.status === 'active' ? 'نشط' : 'موقوف'}
                                                        </button>
                                                    </div>

                                                    {/* Active Services Count */}
                                                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-3">
                                                        الخدمات المفعّلة ({activeCount} / 5)
                                                    </p>

                                                    {/* Services Grid */}
                                                    <div className="grid grid-cols-2 gap-2 mb-5">
                                                        {[
                                                            { slug: 'ai-booking', name: 'الحجز الذكي', color: 'cyan' },
                                                            { slug: 'crm', name: 'CRM', color: 'blue' },
                                                            { slug: 'will-ai', name: 'Will AI', color: 'fuchsia' },
                                                            { slug: 'retail-store', name: 'المتجر', color: 'amber' },
                                                            { slug: 'marketing-studio', name: 'التسويق', color: 'pink' },
                                                            { slug: 'ads-events', name: 'الفعاليات', color: 'green' },
                                                        ].map(ps => {
                                                            const isServiceEnabled = (salon.services || []).some(s => s.slug === ps.slug);
                                                            const colorMap: Record<string, string> = {
                                                                cyan: isServiceEnabled ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-white/3 text-white/20 border-white/5',
                                                                blue: isServiceEnabled ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-white/3 text-white/20 border-white/5',
                                                                fuchsia: isServiceEnabled ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30' : 'bg-white/3 text-white/20 border-white/5',
                                                                amber: isServiceEnabled ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-white/3 text-white/20 border-white/5',
                                                                pink: isServiceEnabled ? 'bg-pink-500/10 text-pink-400 border-pink-500/30' : 'bg-white/3 text-white/20 border-white/5',
                                                                green: isServiceEnabled ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-white/3 text-white/20 border-white/5',
                                                            };
                                                            return (
                                                                <div key={ps.slug} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-bold ${colorMap[ps.color]} transition-all`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isServiceEnabled ? 'bg-current' : 'bg-white/10'}`}></span>
                                                                    {ps.name}
                                                                    {isServiceEnabled && <span className="mr-auto text-[8px] opacity-60">✓</span>}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Action Button */}
                                                    <button
                                                        onClick={() => { setSelectedTenant(salon); setShowServiceModal(true); }}
                                                        className="w-full py-3 bg-fuchsia-600/10 border border-fuchsia-500/20 text-fuchsia-300 rounded-2xl text-xs font-bold hover:bg-fuchsia-600 hover:text-white hover:border-fuchsia-600 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Settings size={14} />
                                                        إدارة الخدمات والصلاحيات
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}


                        {activeTab === 'companies' && (
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
                        )}

                        {activeTab === 'b2b_analytics' && (
                            <div className="space-y-8">
                                <h2 className="text-2xl font-bold">إحصائيات سوق الجملة B2B</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-[#121214] p-8 rounded-[40px] border border-white/5 text-center">
                                        <div className="w-16 h-16 bg-cyan-500/10 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4"><ShoppingBag /></div>
                                        <h4 className="text-white/40 text-sm">إجمالي الطلبات</h4>
                                        <p className="text-4xl font-black">{stats?.b2bStats?.totalOrders ?? 0}</p>
                                    </div>
                                    <div className="bg-[#121214] p-8 rounded-[40px] border border-white/5 text-center">
                                        <div className="w-16 h-16 bg-fuchsia-500/10 text-fuchsia-400 rounded-full flex items-center justify-center mx-auto mb-4"><DollarSign /></div>
                                        <h4 className="text-white/40 text-sm">حجم التداول GMV</h4>
                                        <p className="text-4xl font-black">{(stats?.b2bStats?.totalValue ?? 0).toLocaleString()} ج.م</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'content' && (
                            <div className="space-y-8">
                                <header className="flex justify-between items-center">
                                    <h2 className="text-2xl font-bold">إدارة المحتوى والفعاليات</h2>
                                    <button onClick={() => setShowArticleModal(true)} className="bg-fuchsia-600 text-white font-black px-6 py-3 rounded-2xl text-xs flex items-center gap-2"><Plus size={16} /> مقال جديد</button>
                                </header>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-white/20 uppercase tracking-widest px-2">آخر المقالات</h3>
                                        {articles.length === 0 ? <p className="text-xs text-white/20 p-4">لا يوجد مقالات</p> : articles.map(article => (
                                            <div key={article.id} className="bg-[#121214] p-4 rounded-3xl border border-white/5 flex gap-4 items-center group hover:border-red-500/20 transition-all">
                                                <img src={article.image_url} className="w-16 h-16 rounded-xl object-cover bg-black flex-shrink-0" alt="" />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-sm truncate">{article.title}</h4>
                                                    <p className="text-[10px] text-white/40">{article.category} | {new Date(article.created_at).toLocaleDateString('ar-EG')}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteArticle(article.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-[10px] font-bold hover:bg-red-500 hover:text-white flex-shrink-0"
                                                >
                                                    حذف
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-white/20 uppercase tracking-widest px-2">الفعاليات والطلبات الإعلانية</h3>
                                        {events.length === 0 ? <p className="text-xs text-white/20 p-4">لا يوجد فعاليات معلقة</p> : events.map((event: any) => (
                                            <div key={event.id} className="bg-[#121214] p-6 rounded-[32px] border border-white/5 space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-sm">{event.title}</h4>
                                                        <p className="text-[10px] text-white/40">الناشر: {event.tenant?.name}</p>
                                                    </div>
                                                    <span className={`text-[9px] font-bold px-2 py-1 rounded-lg ${
                                                        event.status === 'active' ? 'bg-green-500/10 text-green-400' : 
                                                        event.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 
                                                        'bg-amber-500/10 text-amber-400'
                                                    }`}>
                                                        {event.status === 'active' ? 'نشط ومفعل' : 
                                                         event.status === 'rejected' ? 'مرفوض' : 'في انتظار المراجعة'}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex gap-2">
                                                    {event.status !== 'active' && (
                                                        <button 
                                                            onClick={() => handleUpdateEventStatus(event.id, 'active')}
                                                            className="flex-1 py-2 bg-green-500 text-black text-[10px] font-black rounded-xl hover:bg-green-400 transition-all"
                                                        >
                                                            تنشيط ونشر
                                                        </button>
                                                    )}
                                                    {event.status === 'active' && (
                                                        <button 
                                                            onClick={() => handleUpdateEventStatus(event.id, 'pending')}
                                                            className="flex-1 py-2 bg-white/5 text-white text-[10px] font-bold rounded-xl border border-white/10 hover:bg-white/10 transition-all"
                                                        >
                                                            تعطيل مؤقت
                                                        </button>
                                                    )}
                                                    {event.status !== 'rejected' && (
                                                        <button 
                                                            onClick={() => handleUpdateEventStatus(event.id, 'rejected')}
                                                            className="py-2 px-4 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                                                        >
                                                            رفض نهائي
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ai_monitor' && stats && (
                            <div className="space-y-8">
                                <h2 className="text-2xl font-bold flex items-center gap-3"><Shield className="text-green-400" /> مراقب AI Shield</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                                    <div className="bg-[#121214] p-5 md:p-8 rounded-[24px] md:rounded-[40px] border border-white/5">
                                        <h4 className="text-white/40 text-[10px] md:text-xs mb-1 md:mb-2">الرسائل</h4>
                                        <p className="text-2xl md:text-3xl font-black text-cyan-400">{stats.aiStats?.totalMessages}</p>
                                    </div>
                                    <div className="bg-[#121214] p-5 md:p-8 rounded-[24px] md:rounded-[40px] border border-white/5">
                                        <h4 className="text-white/40 text-[10px] md:text-xs mb-1 md:mb-2">سبام</h4>
                                        <p className="text-2xl md:text-3xl font-black text-red-400">{stats.aiStats?.spamAlerts}</p>
                                    </div>
                                    <div className="bg-[#121214] p-5 md:p-8 rounded-[24px] md:rounded-[40px] border border-white/5">
                                        <h4 className="text-white/40 text-[10px] md:text-xs mb-1 md:mb-2">هلوسة</h4>
                                        <p className="text-2xl md:text-3xl font-black text-amber-400">{stats.aiStats?.hallucinationAlerts ?? 0}</p>
                                    </div>
                                    <div className="bg-[#121214] p-5 md:p-8 rounded-[24px] md:rounded-[40px] border border-white/5">
                                        <h4 className="text-white/40 text-[10px] md:text-xs mb-1 md:mb-2">الدقة</h4>
                                        <p className="text-2xl md:text-3xl font-black text-green-400">{stats?.aiStats?.aiSuccessRate ?? 0}%</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg">سجل الرقابة العسكرية (AI Audit Log)</h3>
                                    
                                    {/* Mobile View: Cards */}
                                    <div className="md:hidden space-y-4">
                                        {aiSecurityLogs.map((log) => (
                                            <div key={log.id} className={`bg-[#121214] p-4 rounded-[24px] border ${log.is_hallucination ? 'border-red-500/30 bg-red-500/5' : 'border-white/5'} space-y-3`}>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-sm text-cyan-400">{log.tenant_name || 'نظام عام'}</span>
                                                    {log.is_hallucination ? (
                                                        <span className="text-red-400 text-[10px] font-bold flex items-center gap-1"><XCircle size={12} /> هلوسة</span>
                                                    ) : (
                                                        <span className="text-green-400 text-[10px] font-bold flex items-center gap-1"><CheckCircle size={12} /> آمن</span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-white/60 bg-black/20 p-3 rounded-xl border border-white/5">
                                                    <p className="text-white/30 mb-1">الرد:</p>
                                                    <p className="line-clamp-3">{log.response_received}</p>
                                                </div>
                                                <div className="flex justify-between items-center text-[9px] text-white/20">
                                                    <span>ميزة: {log.feature}</span>
                                                    <span>{new Date(log.created_at).toLocaleTimeString('ar-EG')}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop View: Table */}
                                    <div className="hidden md:block bg-[#121214] rounded-[40px] overflow-hidden border border-white/5">
                                        <table className="w-full text-right text-xs">
                                            <thead className="bg-white/5 border-b border-white/5">
                                                <tr>
                                                    <th className="p-4 text-white/40">الجهة</th>
                                                    <th className="p-4 text-white/40">الميزة</th>
                                                    <th className="p-4 text-white/40">الرد</th>
                                                    <th className="p-4 text-white/40">الحالة</th>
                                                    <th className="p-4 text-white/40">الوقت</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {aiSecurityLogs.map((log) => (
                                                    <tr key={log.id} className={`border-b border-white/5 ${log.is_hallucination ? 'bg-red-500/5' : ''}`}>
                                                        <td className="p-4 font-bold">{log.tenant_name || 'عام'}</td>
                                                        <td className="p-4">{log.feature}</td>
                                                        <td className="p-4 max-w-xs truncate">{log.response_received}</td>
                                                        <td className="p-4">
                                                            {log.is_hallucination ? (
                                                                <span className="text-red-400 font-bold flex items-center gap-1"><XCircle size={12} /> هلوسة</span>
                                                            ) : (
                                                                <span className="text-green-400 font-bold flex items-center gap-1"><CheckCircle size={12} /> آمن</span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-white/20">{new Date(log.created_at).toLocaleString('ar-EG')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}


                        {activeTab === 'payments' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold">طلبات الدفع</h2>
                                {payments.length === 0 ? <div className="p-20 bg-[#121214] rounded-[40px] border border-white/5 text-center text-white/20">لا يوجد طلبات معلقة</div> : (
                                    <div className="space-y-4">
                                        {payments.map(p => (
                                            <div key={p.id} className="bg-[#121214] p-6 rounded-[32px] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                                                <div className="flex gap-6 items-center">
                                                    {/* Receipt Preview */}
                                                    <div className="w-24 h-32 bg-black rounded-2xl border border-white/10 overflow-hidden cursor-zoom-in" onClick={() => window.open(`${api.defaults.baseURL?.replace('/api', '')}/storage/${p.receipt_path}`, '_blank')}>
                                                        <img 
                                                            src={`${api.defaults.baseURL?.replace('/api', '')}/storage/${p.receipt_path}`} 
                                                            className="w-full h-full object-cover hover:scale-110 transition-transform" 
                                                            alt="Receipt" 
                                                            onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Receipt')}
                                                        />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-lg">{p.tenant.name}</h4>
                                                        <p className="text-xs text-white/40 mb-1">المبلغ: <span className="text-cyan-400 font-bold">{p.amount} ج.م</span></p>
                                                        <p className="text-[10px] text-white/20">رقم المحول: {p.sender_phone || 'غير مسجل'}</p>
                                                        <p className="text-[10px] text-white/20">التاريخ: {new Date(p.created_at).toLocaleString('ar-EG')}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 w-full md:w-auto">
                                                    <button onClick={() => handleVerifyPayment(p.id, 'approved')} className="flex-1 md:flex-none bg-green-500 text-black font-black px-8 py-3 rounded-2xl text-xs hover:bg-green-400 transition-all">قبول واعتماد</button>
                                                    <button onClick={() => handleVerifyPayment(p.id, 'rejected')} className="flex-1 md:flex-none bg-red-500/10 text-red-400 font-bold px-8 py-3 rounded-2xl text-xs border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">رفض</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'support' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold">الدعم الفني</h2>
                                <div className="space-y-4">
                                    {supportTickets.map(ticket => (
                                        <div key={ticket.id} className="bg-[#121214] p-6 rounded-[32px] border border-white/5 flex justify-between items-center">
                                            <div className="flex gap-4 items-center">
                                                <div className={`w-2 h-10 rounded-full ${ticket.priority === 'high' ? 'bg-red-500' : 'bg-cyan-500'}`} />
                                                <div><h4 className="font-bold text-sm">{ticket.subject}</h4><p className="text-[10px] text-white/40">{ticket.salon} | {ticket.date}</p></div>
                                            </div>
                                            <button onClick={() => { setSelectedTicket(ticket); setShowTicketModal(true); }} className="px-6 py-2 bg-white/5 rounded-xl text-xs font-bold hover:bg-white hover:text-black transition-all">فتح</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'plans' && (
                            <div className="space-y-8">
                                <header className="flex justify-between items-center"><h2 className="text-2xl font-bold">إدارة الباقات</h2><button onClick={() => { setEditingPlan(null); setPlanForm({ name: '', price: 0, description: '', services: [] }); setShowPlanModal(true); }} className="bg-white text-black font-black px-6 py-3 rounded-2xl text-xs">+ باقة جديدة</button></header>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {plans.map(plan => (
                                        <div key={plan.id} className="bg-[#121214] p-8 rounded-[40px] border border-white/5 group relative">
                                            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                                            <div className="text-3xl font-black text-fuchsia-500 mb-2">{plan.price} <span className="text-sm text-white/20">ج.م</span></div>
                                            <div className="flex flex-wrap gap-1 mb-6">
                                                {plan.services?.map(s => (
                                                    <span key={s.id} className="text-[8px] bg-white/5 px-2 py-0.5 rounded-full text-white/40">{s.name}</span>
                                                ))}
                                            </div>
                                            <button onClick={() => { 
                                                setEditingPlan(plan); 
                                                setPlanForm({ 
                                                    name: plan.name, 
                                                    price: plan.price, 
                                                    description: plan.description,
                                                    services: plan.services?.map(s => s.id) || []
                                                }); 
                                                setShowPlanModal(true); 
                                            }} className="w-full py-3 bg-white/5 rounded-2xl text-xs font-bold border border-white/10 group-hover:bg-white group-hover:text-black transition-all">تعديل</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </motion.div>

                        {/* ========= تبويب إدارة المسوقين ========= */}
                        {activeTab === 'affiliates' && (
                            <motion.div key="affiliates" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                <header className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                            <UserCheck className="text-fuchsia-400" size={28} />
                                            إدارة المسوقين بالعمولة
                                        </h2>
                                        <p className="text-sm text-white/40 mt-1">تتبع أداء فريق التسويق وإدارة العمولات</p>
                                    </div>
                                </header>

                                {/* Stats Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[
                                        { label: 'إجمالي المسوقين', value: affiliates.length, icon: Users, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10 border-fuchsia-500/20' },
                                        { label: 'إجمالي العمولات المدفوعة', value: affiliates.reduce((s, a) => s + (a.total_earned || 0), 0).toLocaleString() + ' ج.م', icon: Banknote, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
                                        { label: 'أرصدة معلقة', value: affiliates.reduce((s, a) => s + (a.balance || 0), 0).toLocaleString() + ' ج.م', icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                                    ].map((s, i) => (
                                        <div key={i} className={`${s.bg} border p-6 rounded-[32px] flex items-center gap-4`}>
                                            <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${s.color}`}><s.icon size={22} /></div>
                                            <div>
                                                <p className="text-xs text-white/40 mb-1">{s.label}</p>
                                                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Affiliates Content */}
                                <div className="space-y-6">
                                    {/* Mobile View: Cards */}
                                    <div className="md:hidden space-y-4">
                                        {affiliates.map((aff) => (
                                            <div key={aff.id} className="bg-[#121214] p-5 rounded-[28px] border border-white/5 space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-bold text-base">{aff.user?.name}</div>
                                                        <div className="text-[10px] text-white/30 font-mono">{aff.user?.phone}</div>
                                                    </div>
                                                    <span className={`text-[9px] font-bold px-3 py-1 rounded-full border ${
                                                        aff.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                    }`}>
                                                        {aff.status === 'active' ? 'نشط' : 'موقوف'}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                                                    <div>
                                                        <p className="text-[9px] text-white/30 mb-1">كود التسويق</p>
                                                        <p className="text-xs font-bold text-fuchsia-400">{aff.promo_code}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] text-white/30 mb-1">الرصيد</p>
                                                        <p className="text-xs font-bold text-amber-400">{aff.balance?.toLocaleString()} ج.م</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {aff.balance > 0 && (
                                                        <button 
                                                            onClick={async () => {
                                                                try {
                                                                    await api.post(`/admin/affiliates/${aff.id}/payout`);
                                                                    toast.success(`تم صرف ${aff.balance} ج.م`);
                                                                    fetchData();
                                                                } catch { toast.error('خطأ في الصرف'); }
                                                            }}
                                                            className="flex-1 py-3 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl text-[10px] font-bold"
                                                        >
                                                            صرف الرصيد
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={async () => {
                                                            try {
                                                                await api.patch(`/admin/affiliates/${aff.id}/toggle-status`);
                                                                fetchData();
                                                            } catch { toast.error('خطأ'); }
                                                        }}
                                                        className="flex-1 py-3 bg-white/5 text-white/40 border border-white/10 rounded-xl text-[10px] font-bold"
                                                    >
                                                        تغيير الحالة
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop View: Table */}
                                    <div className="hidden md:block bg-[#121214] border border-white/5 rounded-[40px] overflow-hidden">
                                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                            <h3 className="font-bold text-lg">قائمة المسوقين</h3>
                                            <span className="text-xs text-white/30 bg-white/5 px-3 py-1 rounded-full">{affiliates.length} مسوق مسجل</span>
                                        </div>

                                        {affiliates.length === 0 ? (
                                            <div className="p-20 text-center">
                                                <UserCheck size={40} className="text-white/10 mx-auto mb-4" />
                                                <p className="text-white/20 text-sm">لا يوجد مسوقون مسجلون حتى الآن</p>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-right text-sm">
                                                    <thead className="bg-white/5 border-b border-white/5">
                                                        <tr>
                                                            <th className="p-5 text-white/40 font-bold">المسوق</th>
                                                            <th className="p-5 text-white/40 font-bold">كود التسويق</th>
                                                            <th className="p-5 text-white/40 font-bold">النسبة</th>
                                                            <th className="p-5 text-white/40 font-bold">الرصيد</th>
                                                            <th className="p-5 text-white/40 font-bold">إجمالي الأرباح</th>
                                                            <th className="p-5 text-white/40 font-bold">الحالة</th>
                                                            <th className="p-5 text-white/40 font-bold">إجراء</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {affiliates.map((aff) => (
                                                            <tr key={aff.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                                                <td className="p-5">
                                                                    <div className="font-bold">{aff.user?.name}</div>
                                                                    <div className="text-xs text-white/30 font-mono">{aff.user?.phone}</div>
                                                                </td>
                                                                <td className="p-5">
                                                                    <div className="flex items-center gap-2">
                                                                        <Link size={12} className="text-fuchsia-400" />
                                                                        <span className="font-mono font-bold text-fuchsia-300 bg-fuchsia-500/10 px-2 py-0.5 rounded-lg text-xs">{aff.promo_code}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-5">
                                                                    <span className="text-cyan-400 font-black">{aff.commission_percentage}%</span>
                                                                </td>
                                                                <td className="p-5">
                                                                    <span className={`font-bold ${aff.balance > 0 ? 'text-amber-400' : 'text-white/30'}`}>
                                                                        {(aff.balance || 0).toLocaleString()} ج.م
                                                                    </span>
                                                                </td>
                                                                <td className="p-5">
                                                                    <span className="text-green-400 font-bold">{(aff.total_earned || 0).toLocaleString()} ج.م</span>
                                                                </td>
                                                                <td className="p-5">
                                                                    <button 
                                                                        onClick={async () => {
                                                                            try {
                                                                                await api.patch(`/admin/affiliates/${aff.id}/toggle-status`);
                                                                                toast.success(`تم تحديث حالة المسوق ${aff.user?.name}`);
                                                                                fetchData();
                                                                            } catch {
                                                                                toast.error('خطأ في تحديث الحالة');
                                                                            }
                                                                        }}
                                                                        className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all cursor-pointer ${
                                                                            aff.status === 'active'
                                                                                ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500 hover:text-black'
                                                                                : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white'
                                                                        }`}>
                                                                        {aff.status === 'active' ? 'نشط' : 'موقوف'}
                                                                    </button>
                                                                </td>
                                                                <td className="p-5">
                                                                    {aff.balance > 0 && (
                                                                        <button
                                                                            onClick={async () => {
                                                                                try {
                                                                                    await api.post(`/admin/affiliates/${aff.id}/payout`);
                                                                                    toast.success(`تم صرف ${aff.balance} ج.م للمسوق ${aff.user?.name}`);
                                                                                    fetchData();
                                                                                } catch {
                                                                                    toast.error('خطأ في عملية الصرف');
                                                                                }
                                                                            }}
                                                                            className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl text-xs font-bold hover:bg-green-500 hover:text-black transition-all"
                                                                        >
                                                                            <Banknote size={12} /> صرف الرصيد
                                                                        </button>
                                                                    )}
                                                                    {!aff.balance && <span className="text-xs text-white/20">لا يوجد رصيد</span>}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ========= تبويب مخزن المنتجات المركزي ========= */}
                        {activeTab === 'products' && (
                            <motion.div key="products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                {/* Header */}
                                <header>
                                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                        <Package className="text-amber-400" size={28} />
                                        مخزن المنتجات المركزي
                                    </h2>
                                    <p className="text-sm text-white/40 mt-1">راجع كل منتج قبل ظهوره للصالونات — أنت البوابة الأخيرة.</p>
                                </header>

                                {/* Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: 'إجمالي المنتجات', value: productStats.total, color: 'text-white', bg: 'bg-white/5' },
                                        { label: 'بانتظار المراجعة', value: productStats.pending, color: 'text-amber-400', bg: 'bg-amber-500/10 border border-amber-500/20' },
                                        { label: 'معتمدة', value: productStats.approved, color: 'text-green-400', bg: 'bg-green-500/10 border border-green-500/20' },
                                        { label: 'مرفوضة', value: productStats.rejected, color: 'text-red-400', bg: 'bg-red-500/10 border border-red-500/20' },
                                    ].map((s, i) => (
                                        <div key={i} className={`${s.bg} p-5 rounded-3xl text-center`}>
                                            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                                            <p className="text-[10px] text-white/40 mt-1 font-bold">{s.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Filters + Search */}
                                <div className="flex flex-col md:flex-row gap-4 items-center">
                                    <div className="flex gap-2 bg-white/5 p-1 rounded-2xl">
                                        {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
                                            <button key={f} onClick={() => setProductFilter(f)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${productFilter === f ? 'bg-fuchsia-600 text-white' : 'text-white/40 hover:text-white'}`}>
                                                {f === 'pending' ? '⏳ منتظر' : f === 'approved' ? '✅ معتمد' : f === 'rejected' ? '❌ مرفوض' : '📦 الكل'}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="relative flex-1">
                                        <Search size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30" />
                                        <input
                                            type="text"
                                            placeholder="ابحث عن منتج أو شركة..."
                                            value={productSearch}
                                            onChange={e => setProductSearch(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:border-fuchsia-500 text-white"
                                        />
                                    </div>
                                </div>

                                {/* Product List */}
                                {(() => {
                                    const filtered = products
                                        .filter(p => productFilter === 'all' || p.status === productFilter)
                                        .filter(p => productSearch === '' ||
                                            p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                                            p.tenant?.name?.toLowerCase().includes(productSearch.toLowerCase())
                                        );
                                    if (filtered.length === 0) return (
                                        <div className="p-20 bg-[#121214] rounded-[40px] border border-white/5 text-center">
                                            <Package size={40} className="text-white/10 mx-auto mb-4" />
                                            <p className="text-white/20 text-sm">لا توجد منتجات في هذا التصنيف</p>
                                        </div>
                                    );
                                    return (
                                        <div className="space-y-4">
                                            {filtered.map(product => (
                                                <div key={product.id} className="bg-[#121214] border border-white/5 rounded-[32px] p-6 flex flex-col md:flex-row gap-6 items-start md:items-center hover:border-white/10 transition-all group">
                                                    {/* Image */}
                                                    <div className="w-20 h-20 bg-black rounded-2xl border border-white/10 overflow-hidden flex-shrink-0">
                                                        {product.image_url
                                                            ? <img src={product.image_url} className="w-full h-full object-cover" alt={product.name} />
                                                            : <div className="w-full h-full flex items-center justify-center text-white/10"><Package size={24} /></div>
                                                        }
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-bold text-base truncate">{product.name}</h4>
                                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${
                                                                product.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                                                                product.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                                                                'bg-amber-500/10 text-amber-400'
                                                            }`}>
                                                                {product.status === 'approved' ? 'معتمد' : product.status === 'rejected' ? 'مرفوض' : 'انتظار'}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-white/40 mb-1 truncate">{product.description}</p>
                                                        <div className="flex items-center gap-4 flex-wrap">
                                                            <span className="text-fuchsia-400 font-black text-sm">{product.price?.toLocaleString()} ج.م</span>
                                                            <span className="text-[10px] text-white/30">المورّد: <span className="text-cyan-400 font-bold">{product.tenant?.name}</span></span>
                                                            <span className="text-[10px] text-white/20">{new Date(product.created_at).toLocaleDateString('ar-EG')}</span>
                                                        </div>
                                                        {product.rejection_reason && (
                                                            <p className="text-[10px] text-red-400/70 mt-1">سبب الرفض: {product.rejection_reason}</p>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex gap-2 flex-shrink-0">
                                                        {product.status !== 'approved' && (
                                                            <button onClick={() => handleProductStatus(product.id, 'approved')}
                                                                className="flex items-center gap-1.5 px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl text-xs font-bold hover:bg-green-500 hover:text-black transition-all">
                                                                <CheckCircle size={14} /> قبول
                                                            </button>
                                                        )}
                                                        {product.status !== 'rejected' && (
                                                            <button onClick={() => {
                                                                const reason = window.prompt('اكتب سبب الرفض (اختياري):') || undefined;
                                                                handleProductStatus(product.id, 'rejected', reason);
                                                            }}
                                                                className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all">
                                                                <XCircle size={14} /> رفض
                                                            </button>
                                                        )}
                                                        <button onClick={() => handleDeleteProduct(product.id)}
                                                            className="p-2 bg-white/5 text-white/30 border border-white/10 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </motion.div>
                        )}


                </AnimatePresence>
                </div>
            </main>

            {/* Modals */}
            <AnimatePresence>
                {showServiceModal && selectedTenant && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowServiceModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-3xl bg-[#121214] border border-white/10 rounded-[32px] md:rounded-[40px] p-6 md:p-10 shadow-2xl overflow-hidden">
                            <button onClick={() => setShowServiceModal(false)} className="absolute top-6 left-6 md:top-8 md:left-8 text-white/20 hover:text-white transition-all"><X size={24} /></button>
                            <h3 className="text-2xl md:text-3xl font-black mb-6 md:mb-8 text-right">تعديل موديولات {selectedTenant.name}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                                {allServices.length === 0 ? (
                                    <p className="text-white/40 text-center py-4 col-span-2">جاري تحميل قائمة الخدمات السيادية...</p>
                                ) : allServices.map(service => {
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
                                <input placeholder="التصنيف" value={articleForm.category} onChange={e => setArticleForm({ ...articleForm, category: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-fuchsia-500" />
                                <input placeholder="رابط الصورة" value={articleForm.image} onChange={e => setArticleForm({ ...articleForm, image: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-fuchsia-500" />
                                <textarea required placeholder="محتوى المقال" value={articleForm.content} onChange={e => setArticleForm({ ...articleForm, content: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 h-40 focus:outline-none focus:border-fuchsia-500" />
                                <button type="submit" className="w-full bg-fuchsia-600 text-white font-black py-4 rounded-2xl hover:bg-fuchsia-500 transition-all shadow-lg shadow-fuchsia-600/20">نشر الآن</button>
                            </form>
                        </motion.div>
                    </div>
                )}


                {showPlanModal && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPlanModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md bg-[#121214] border border-white/10 rounded-[32px] md:rounded-[40px] p-6 md:p-8">
                            <button onClick={() => setShowPlanModal(false)} className="absolute top-6 left-6 text-white/20 hover:text-white transition-all"><X size={20} /></button>
                            <h3 className="text-2xl font-bold mb-6 text-right">{editingPlan ? 'تعديل باقة' : 'إضافة باقة'}</h3>
                             <form onSubmit={handlePlanSubmit} className="space-y-4">
                                 <input required placeholder="اسم الباقة" value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-cyan-500" />
                                 <input type="number" required placeholder="السعر" value={planForm.price} onChange={e => setPlanForm({ ...planForm, price: Number(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-cyan-500" />
                                 <textarea placeholder="الوصف" value={planForm.description} onChange={e => setPlanForm({ ...planForm, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 h-24 focus:outline-none focus:border-cyan-500" />
                                 
                                 <div className="space-y-3">
                                     <label className="text-xs font-bold text-white/40 block mr-2">الموديولات المتاحة في هذه الباقة:</label>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                         {allServices.map(service => (
                                             <label key={service.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all">
                                                 <input 
                                                     type="checkbox" 
                                                     className="w-5 h-5 rounded accent-cyan-500" 
                                                     checked={planForm.services.includes(service.id)}
                                                     onChange={e => {
                                                         const ids = e.target.checked 
                                                             ? [...planForm.services, service.id]
                                                             : planForm.services.filter(id => id !== service.id);
                                                         setPlanForm({ ...planForm, services: ids });
                                                     }}
                                                 />
                                                 <span className="text-sm">{service.name}</span>
                                             </label>
                                         ))}
                                     </div>
                                 </div>

                                 <button type="submit" className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-cyan-400 transition-all">حفظ الباقة</button>
                             </form>
                        </motion.div>
                    </div>
                )}

                {showTicketModal && selectedTicket && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTicketModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md bg-[#121214] border border-white/10 rounded-[32px] md:rounded-[40px] p-6 md:p-8">
                            <button onClick={() => setShowTicketModal(false)} className="absolute top-6 left-6 text-white/20 hover:text-white transition-all"><X size={20} /></button>
                            <h3 className="text-2xl font-bold mb-2 text-right">{selectedTicket.subject}</h3>
                            <p className="text-xs text-white/40 mb-6">الصالون: {selectedTicket.salon}</p>
                            
                            <div className="space-y-4">
                                <textarea 
                                    placeholder="اكتب ردك هنا ليرسله النظام للصالون..." 
                                    value={ticketReply}
                                    onChange={e => setTicketReply(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 h-32 focus:outline-none focus:border-fuchsia-500 text-sm"
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => handleTicketAction(selectedTicket.id, 'resolved')} className="bg-green-500 text-black font-black py-4 rounded-2xl text-xs hover:bg-green-400 transition-all">حل التذكرة وإغلاقها</button>
                                    <button onClick={() => handleTicketAction(selectedTicket.id, 'open')} className="bg-white/5 text-white font-bold py-4 rounded-2xl text-xs hover:bg-white/10 border border-white/10">إرسال رد فقط</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
                {showCompanyStatsModal && selectedCompanyStats && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCompanyStatsModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-2xl bg-[#121214] border border-white/10 rounded-[32px] md:rounded-[40px] p-6 md:p-8 shadow-2xl">
                            <button onClick={() => setShowCompanyStatsModal(false)} className="absolute top-6 left-6 text-white/20 hover:text-white transition-all"><X size={20} /></button>
                            
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center">
                                    <TrendingUp size={24} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">إحصائيات {selectedCompanyStats.company_name}</h3>
                                    <p className="text-xs text-white/40">أداء المبيعات والنشاط الترويجي</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-white/5 border border-white/5 p-6 rounded-3xl">
                                    <p className="text-[10px] text-white/30 uppercase font-bold mb-1">إجمالي المبيعات</p>
                                    <h4 className="text-2xl font-black text-cyan-400">{(selectedCompanyStats.total_value ?? 0).toLocaleString()} ج.م</h4>
                                    <p className="text-[10px] text-white/20 mt-1">من خلال {selectedCompanyStats.total_orders} طلب جملة</p>
                                </div>
                                <div className="bg-white/5 border border-white/5 p-6 rounded-3xl">
                                    <p className="text-[10px] text-white/30 uppercase font-bold mb-1">تفاعل الإعلانات</p>
                                    <h4 className="text-2xl font-black text-fuchsia-400">{(selectedCompanyStats.event_clicks ?? 0).toLocaleString()} نقرة</h4>
                                    <p className="text-[10px] text-white/20 mt-1">عبر {selectedCompanyStats.active_events} فاعلية نشطة</p>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/5 p-6 rounded-3xl">
                                <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                                    <ShoppingBag size={16} className="text-amber-400" /> المنتجات الأكثر طلباً
                                </h4>
                                <div className="space-y-3">
                                    {selectedCompanyStats.top_products.length === 0 ? (
                                        <p className="text-xs text-white/20 text-center py-4">لا يوجد بيانات مبيعات بعد</p>
                                    ) : selectedCompanyStats.top_products.map((p: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                                            <span className="text-xs text-white/80">{p.name}</span>
                                            <span className="text-xs font-bold text-white">{p.total_sold} قطعة</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={() => setShowCompanyStatsModal(false)}
                                className="w-full mt-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/10"
                            >
                                إغلاق النافذة
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default AdminDashboard;
