import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Megaphone,
    LogOut,
    TrendingUp,
    Sparkles,
    MessageSquare,
    BarChart3,
    MapPin,
    ChevronLeft,
    Package,
    ShoppingCart,
    AlertTriangle,
    GraduationCap,
    Award,
    Star,
    Bell,
    GitBranch,
    Lock
} from 'lucide-react';
import api from '../api/config';
import { toast } from 'react-hot-toast';
import CatalogTab from '../components/CatalogTab';
import OrdersTab from '../components/OrdersTab';
import CrmPipelineTab from '../components/CrmPipelineTab';
import MarketingTab from '../components/MarketingTab';
import SalesTeamTab from '../components/SalesTeamTab';
import ReportsTab from '../components/ReportsTab';
import EventsTab from '../components/EventsTab';
import MarketingStudio from '../components/MarketingStudio';

interface CompanyOrder {
    id: string;
    status: string;
    total_amount: string | number;
    created_at: string;
    client?: {
        salon_name: string;
        city: string;
    };
    items?: {
        product: { name: string };
        quantity: number;
    }[];
}

type TabType = 'overview' | 'events' | 'crm' | 'pipeline' | 'ai' | 'marketing' | 'reports' | 'sales_team' | 'orders' | 'education' | 'catalog' | 'studio';

export default function CompanyDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    // User & Company Data
    const [companyName, setCompanyName] = useState('شركتك');
    const [userName, setUserName] = useState('');
    const [data, setData] = useState<any>(null);

    // التحقق من تفعيل الخدمات
    const isServiceActive = (slug: string) => {
        return (data?.tenant?.services || []).some((s: any) => s.slug === slug && s.status === 'active');
    };

    // Data States
    const [orders, setOrders] = useState<CompanyOrder[]>([]);
    const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
    const [roiReport, setRoiReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // AI States
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [meRes, ordersRes, suggestionsRes, roiRes] = await Promise.all([
                api.get('/me'),
                api.get('/crm/orders'),
                api.get('/crm/ai-suggestions'),
                api.get('/crm/education/roi')
            ]);

            // جلب بيانات الشركة الحقيقية
            setData(meRes.data);
            setCompanyName(meRes.data?.tenant?.name || 'شركتك');
            setUserName(meRes.data?.user?.name || '');

            setOrders(ordersRes.data.data || []);
            setAiSuggestions(suggestionsRes.data.suggestions || []);
            setRoiReport(roiRes.data.report);
        } catch (err) {
            console.error("Error fetching data", err);
            toast.error("حدث خطأ أثناء جلب البيانات");
        } finally {
            setLoading(false);
        }
    };

    const handleAiConsult = async () => {
        setIsAiLoading(true);
        setAiAnalysis(null);
        try {
            const res = await api.post('/crm/ai-consult');
            setAiAnalysis(res.data.analysis);
            toast.success("تم الانتهاء من التحليل الذكي!");
        } catch (err: any) {
            const message = err.response?.data?.error || err.response?.data?.message || "عذراً، فشل المحرك الذكي في التحليل";
            toast.error(message);
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await api.post('/logout');
        } catch (e) {
            console.error(e);
        } finally {
            localStorage.removeItem('o2oeg_token');
            localStorage.removeItem('o2oeg_user');
            navigate('/login');
        }
    };



    return (
        <div className="bg-[#0A0A0C] text-[#e3e2e7] font-['Inter'] min-h-screen rtl" dir="rtl">
            {/* Background Orbs */}
            <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(192,38,211,0.08)_0%,transparent_70%)] pointer-events-none z-0"></div>
            <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(6,182,212,0.08)_0%,transparent_70%)] pointer-events-none z-0"></div>

            {/* Topbar */}
            <header className="fixed top-0 w-full h-20 bg-[#0A0A0C]/80 backdrop-blur-xl border-b border-white/10 z-50 flex items-center justify-between px-6 lg:px-10 text-right">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-all">
                        <LayoutDashboard size={22} />
                    </button>
                    <div onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                        <span className="text-xl font-black bg-gradient-to-r from-fuchsia-500 to-cyan-500 bg-clip-text text-transparent font-['Space_Grotesk']">O2O EG</span>
                        <span className="text-[10px] font-bold text-fuchsia-400/60 tracking-[0.2em] uppercase hidden sm:block">Enterprise Suite</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="relative p-2 text-white/50 hover:text-white hover:bg-white/8 rounded-full transition-all">
                        <Bell size={19} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-fuchsia-500 rounded-full shadow-[0_0_10px_rgba(192,38,211,0.8)]"></span>
                    </button>
                    <div className="flex items-center gap-3 border-r border-white/10 pr-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-white leading-none">{userName || 'مدير الشركة'}</p>
                            <p className="text-[10px] text-fuchsia-400 leading-none mt-1">{companyName}</p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-fuchsia-600 to-cyan-600 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-fuchsia-600/20">
                            {companyName.charAt(0)}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Sidebar Backdrop */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`fixed top-20 right-0 h-[calc(100vh-80px)] w-64 bg-[#0d0d10]/98 backdrop-blur-xl border-l border-white/8 z-40 transition-all duration-300 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'} flex flex-col shadow-2xl`}>
                <nav className="p-3 flex-1 overflow-y-auto flex flex-col gap-0.5">
                    {/* --- Group 1: Strategic Performance --- */}
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-3 pb-2 pt-2">الأداء الاستراتيجي</p>
                    {[
                        { tab: 'overview', icon: LayoutDashboard, label: 'لوحة التحكم', color: 'text-cyan-400' },
                        { tab: 'reports', icon: BarChart3, label: 'التقارير التحليلية', color: 'text-cyan-400' },
                        { tab: 'events', icon: Megaphone, label: 'الإعلانات والفعاليات', color: 'text-fuchsia-400', slug: 'ads-events' },
                    ].map(({ tab, icon: Icon, label, color, slug }) => {
                        const active = slug ? isServiceActive(slug) : true;
                        return (
                            <button
                                key={tab}
                                onClick={() => { 
                                    if (active) {
                                        setActiveTab(tab as TabType); 
                                        setSidebarOpen(false); 
                                    } else {
                                        toast.error("يرجى تفعيل خدمة الإعلانات والفعاليات أولاً");
                                    }
                                }}
                                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-300 text-sm font-bold border ${
                                    activeTab === tab
                                        ? 'bg-gradient-to-r from-fuchsia-600/20 to-cyan-600/20 text-white border-fuchsia-500/25 shadow-[0_0_15px_rgba(192,38,211,0.1)]'
                                        : active
                                            ? 'text-white/40 hover:bg-white/5 hover:text-white/80 border-transparent'
                                            : 'text-white/10 border-transparent cursor-not-allowed opacity-40'
                                }`}
                            >
                                <Icon size={16} className={!active ? 'text-white/10' : (activeTab === tab ? color : '')} />
                                <span className="flex-1">{label}</span>
                                {!active && <Lock size={12} className="text-white/20" />}
                            </button>
                        );
                    })}

                    {/* --- Group 2: Supply Chain --- */}
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-3 pb-2 pt-4">سلسلة التوريد</p>
                    {[
                        { tab: 'orders', icon: ShoppingCart, label: 'الطلبات الواردة', color: 'text-cyan-400' },
                        { tab: 'catalog', icon: Package, label: 'إدارة الكتالوج', color: 'text-cyan-400' },
                    ].map(({ tab, icon: Icon, label, color }) => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab as TabType); setSidebarOpen(false); }}
                            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-300 text-sm font-bold ${
                                activeTab === tab
                                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                                    : 'text-white/40 hover:bg-white/5 hover:text-white/80 border border-transparent'
                            }`}
                        >
                            <Icon size={16} className={activeTab === tab ? color : ''} />
                            <span>{label}</span>
                        </button>
                    ))}

                    {/* --- Group 3: Field Sales --- */}
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-3 pb-2 pt-4">المبيعات الميدانية</p>
                    {[
                        { tab: 'crm', icon: Users, label: 'إدارة الصالونات', color: 'text-cyan-400' },
                        { tab: 'sales_team', icon: MapPin, label: 'فريق المندوبين', color: 'text-green-400' },
                        { tab: 'pipeline', icon: GitBranch, label: 'خط المبيعات (Pipeline)', color: 'text-purple-400' },
                    ].map(({ tab, icon: Icon, label, color }) => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab as TabType); setSidebarOpen(false); }}
                            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-300 text-sm font-bold ${
                                activeTab === tab
                                    ? 'bg-white/10 text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                                    : 'text-white/40 hover:bg-white/5 hover:text-white/80 border border-transparent'
                            }`}
                        >
                            <Icon size={16} className={activeTab === tab ? color : ''} />
                            <span>{label}</span>
                        </button>
                    ))}

                    {/* --- Group 4: Business Intelligence --- */}
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-3 pb-2 pt-4">الذكاء والأثر</p>
                    {[
                        { tab: 'education', icon: GraduationCap, label: 'أثر التدريب (ROI)', color: 'text-amber-400', slug: 'crm' },
                        { tab: 'marketing', icon: MessageSquare, label: 'حملات الواتساب', color: 'text-green-400', slug: 'crm' },
                        { tab: 'studio', icon: Sparkles, label: 'Marketing Studio', color: 'text-fuchsia-400', slug: 'will-ai' },
                        { tab: 'ai', icon: Sparkles, label: 'AI Business Consultant', color: 'text-cyan-400', slug: 'will-ai' },
                    ].map(({ tab, icon: Icon, label, color, slug }) => {
                        const active = isServiceActive(slug);
                        return (
                            <button
                                key={tab}
                                onClick={() => { 
                                    if (active) {
                                        setActiveTab(tab as TabType); 
                                        setSidebarOpen(false); 
                                    } else {
                                        toast.error("هذه الخدمة الذكية غير مفعلة في اشتراكك");
                                    }
                                }}
                                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-300 text-sm font-bold border ${
                                    activeTab === tab
                                        ? 'bg-gradient-to-r from-amber-600/20 to-cyan-600/20 text-white border-amber-500/25 shadow-[0_0_15px_rgba(251,191,36,0.1)]'
                                        : active
                                            ? 'text-white/40 hover:bg-white/5 hover:text-white/80 border-transparent'
                                            : 'text-white/10 border-transparent cursor-not-allowed opacity-40'
                                }`}
                            >
                                <Icon size={16} className={!active ? 'text-white/10' : (activeTab === tab ? color : '')} />
                                <span className="flex-1">{label}</span>
                                {!active && <Lock size={12} className="text-white/20" />}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-3 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm font-medium border border-transparent hover:border-red-500/20"
                    >
                        <LogOut size={16} />
                        تسجيل الخروج
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="pt-28 pb-10 px-6 lg:pr-72 transition-all duration-300 min-h-screen relative z-10 text-right">
                <div className="max-w-6xl mx-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-40">
                            <div className="w-10 h-10 border-4 border-fuchsia-500/20 border-t-fuchsia-500 rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

                                {/* Tab: Overview */}
                                {activeTab === 'overview' && (
                                    <div className="space-y-8">
                                        <div>
                                            <h1 className="text-2xl font-bold text-white font-['Space_Grotesk']">ملخص أداء {companyName}</h1>
                                            <p className="text-sm text-white/40 mt-1">مرحباً {userName}، إليك آخر مؤشرات الأداء الاستراتيجي</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-amber-500/30 transition-all">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl"><TrendingUp size={18} /></div>
                                                    <p className="text-xs text-white/40 font-bold">النمو بعد التدريب</p>
                                                </div>
                                                <p className="text-3xl font-black text-amber-400">+{roiReport?.uplift_percentage ?? 0}%</p>
                                            </div>
                                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-cyan-500/30 transition-all">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl"><ShoppingCart size={18} /></div>
                                                    <p className="text-xs text-white/40 font-bold">طلبات قيد المعالجة</p>
                                                </div>
                                                <p className="text-3xl font-black text-cyan-400">{orders.filter(o => o.status === 'pending').length}</p>
                                            </div>
                                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-fuchsia-500/30 transition-all">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="p-2 bg-fuchsia-500/10 text-fuchsia-400 rounded-xl"><Sparkles size={18} /></div>
                                                    <p className="text-xs text-white/40 font-bold">المقترحات الذكية</p>
                                                </div>
                                                <p className="text-3xl font-black text-fuchsia-400">{aiSuggestions.length}</p>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-r from-amber-600/20 to-transparent border border-amber-500/20 p-6 rounded-3xl flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl"><GraduationCap size={24} /></div>
                                                <div>
                                                    <h3 className="font-bold text-white">هل تود معرفة أثر دوراتك التدريبية؟</h3>
                                                    <p className="text-xs text-white/50">قمنا بتحليل مبيعات الصالونات التي حضرت تدريباتك الأخيرة.</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setActiveTab('education')} className="px-6 py-2 bg-amber-500 text-black font-black rounded-full text-xs hover:bg-amber-400 transition-all flex items-center gap-2 whitespace-nowrap">
                                                عرض التقارير <ChevronLeft size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Tab: Education ROI */}
                                {activeTab === 'education' && roiReport && (
                                    <div className="space-y-8">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-2xl font-bold text-white font-['Space_Grotesk']">أثر التدريب على المبيعات (ROI)</h2>
                                                <p className="text-sm text-white/40">حلل كيف يؤثر تدريب المصففين على زيادة طلبات الصالونات.</p>
                                            </div>
                                            <div className="bg-amber-500/10 border border-amber-500/30 px-6 py-3 rounded-2xl text-center">
                                                <p className="text-[10px] text-amber-400 font-bold uppercase mb-1">زيادة المبيعات بعد التدريب</p>
                                                <p className="text-2xl font-black text-white">+{roiReport.uplift_percentage}%</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
                                                <div className="flex items-center gap-2 mb-8 text-amber-400">
                                                    <TrendingUp size={20} />
                                                    <h3 className="font-bold text-white">مقارنة متوسط المبيعات السنوية</h3>
                                                </div>
                                                <div className="space-y-10">
                                                    <div>
                                                        <div className="flex justify-between text-xs mb-3">
                                                            <span className="text-amber-400 font-bold flex items-center gap-1"><Award size={14} /> صالونات بها مصففون معتمدون</span>
                                                            <span className="text-white font-black">{roiReport.certified_avg_sales?.toLocaleString()} ج.م</span>
                                                        </div>
                                                        <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden">
                                                            <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="h-full bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between text-xs mb-3">
                                                            <span className="text-white/40">صالونات بدون مصففين معتمدين</span>
                                                            <span className="text-white/60 font-bold">{roiReport.non_certified_avg_sales?.toLocaleString()} ج.م</span>
                                                        </div>
                                                        <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden">
                                                            <motion.div initial={{ width: 0 }} animate={{ width: `${(roiReport.non_certified_avg_sales / roiReport.certified_avg_sales) * 100}%` }} className="h-full bg-white/20" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-10 p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-[11px] text-white/40 leading-relaxed">
                                                    <AlertTriangle size={14} className="inline ml-1 text-cyan-400" /> هذه البيانات تشير إلى أن الاستثمار في تدريب المصففين يؤدي مباشرة إلى زيادة ولاء الصالون وارتفاع حجم مشترياته.
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-6">
                                                <div className="bg-gradient-to-br from-fuchsia-600/20 to-cyan-600/20 border border-white/10 p-6 rounded-3xl flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs text-white/50 mb-1">إجمالي المصففين المعتمدين</p>
                                                        <p className="text-3xl font-black text-white">{roiReport.total_certified_stylists}</p>
                                                    </div>
                                                    <div className="p-4 bg-white/10 rounded-2xl text-amber-400"><Award size={32} /></div>
                                                </div>
                                                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                                                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                                        <Star className="text-fuchsia-400" size={18} /> ترشيحات التدريب (AI Advice)
                                                    </h3>
                                                    <div className="space-y-4">
                                                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-xs text-white/70">
                                                            صالون <span className="text-cyan-400 font-bold">لوزا بيوتي</span> لديه مبيعات مرتفعة لكن لا يوجد لديه مصفف معتمد. رشح لهم دورة "Master of Color" القادمة لرفع المبيعات بنسبة 20%.
                                                        </div>
                                                        <button onClick={() => setActiveTab('marketing')} className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-bold transition-all">
                                                            دعوة الصالونات للتدريب القادم
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Tab: AI Consultant */}
                                {activeTab === 'ai' && (
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-br from-fuchsia-600/10 to-cyan-600/10 border border-white/10 p-10 rounded-3xl text-center">
                                            <Sparkles className="text-cyan-400 mx-auto mb-4" size={32} />
                                            <h2 className="text-3xl font-black text-white mb-2">AI Business Consultant</h2>
                                            <p className="text-sm text-white/40 mb-6">تحليل ذكي لبيانات شركتك واقتراحات استراتيجية قابلة للتنفيذ</p>
                                            <button
                                                onClick={handleAiConsult}
                                                disabled={isAiLoading}
                                                className="bg-cyan-500 text-black font-black px-8 py-3 rounded-full hover:bg-cyan-400 transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
                                            >
                                                {isAiLoading ? 'جاري التحليل...' : 'حلل بيانات شركتي'}
                                            </button>
                                        </div>
                                        {aiAnalysis && (
                                            <div className="bg-white/5 border border-cyan-500/30 p-8 rounded-3xl">
                                                <div className="flex items-center gap-2 mb-4 text-cyan-400">
                                                    <Sparkles size={16} />
                                                    <h3 className="font-bold">نتائج التحليل الذكي:</h3>
                                                </div>
                                                <div className="prose prose-invert max-w-none text-white/90 leading-relaxed whitespace-pre-wrap text-right">{aiAnalysis}</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'sales_team' && <SalesTeamTab />}
                                {activeTab === 'catalog' && <CatalogTab />}
                                {activeTab === 'orders' && <OrdersTab />}
                                {activeTab === 'crm' && (
                                    <div className="space-y-6 text-right" dir="rtl">
                                        <div>
                                            <h2 className="text-2xl font-bold text-white font-['Space_Grotesk']">إدارة الصالونات (CRM Clients)</h2>
                                            <p className="text-sm text-white/40 mt-1">قائمة الصالونات المتعاقدة وسجل تعاملاتهم مع شركتك.</p>
                                        </div>
                                        <CrmPipelineTab viewMode="clients" />
                                    </div>
                                )}
                                {activeTab === 'pipeline' && (
                                    <div className="space-y-6 text-right" dir="rtl">
                                        <div>
                                            <h2 className="text-2xl font-bold text-white font-['Space_Grotesk']">خط المبيعات (Sales Pipeline)</h2>
                                            <p className="text-sm text-white/40 mt-1">تتبع مراحل الصفقات من الاهتمام حتى الإغلاق.</p>
                                        </div>
                                        <CrmPipelineTab viewMode="pipeline" />
                                    </div>
                                )}
                                {activeTab === 'marketing' && <MarketingTab />}
                                 {activeTab === 'studio' && <MarketingStudio />}
                                {activeTab === 'events' && <EventsTab />}
                                {activeTab === 'reports' && <ReportsTab />}

                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </main>
        </div>
    );
}
