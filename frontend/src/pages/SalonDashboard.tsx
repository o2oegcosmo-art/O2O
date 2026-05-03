import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Clock,
    X,
    ChevronRight,
    ChevronLeft,
    Sparkles,
    MapPin
} from 'lucide-react';
import GoogleMapComponent from '../components/GoogleMapComponent';
import api from '../api/config';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AdContainer from '../components/AdContainer';
import B2BMarket from '../components/B2BMarket';
import RetailOrdersTab from '../components/RetailOrdersTab';
import MarketingStudio from '../components/MarketingStudio';
import CRMMarketing from '../components/CRMMarketing';

type TabType = 'overview' | 'calendar' | 'customers' | 'staff' | 'services' | 'settings' | 'ai' | 'billing' | 'market' | 'retail-orders' | 'marketing' | 'crm-marketing' | 'whatsapp';

interface Staff {
    id: string;
    name: string;
    specialization: string;
    is_active: boolean;
}

interface ConsultantAdvice {
    summary: string;
    marketing_advice?: string[];
    data_insights?: {
        growth_opportunity: string;
        target_service: string;
    };
    creative_content?: {
        facebook_post: string;
        whatsapp_broadcast: string;
        image_idea: string;
    };
    sales_hack?: string;
    suggested_offer?: {
        title: string;
        details: string;
    };
    setup_warning?: string;
    title?: string;
}

interface DashboardData {
    user: {
        name: string;
        role: string;
    };
    tenant: {
        id: string;
        name: string;
        type: string;
        phone?: string;
        address?: string;
        settings?: {
            accept_cash: boolean;
            accept_wallet?: boolean;
            accept_instapay?: boolean;
            require_deposit: boolean;
            deposit_amount: number;
            payment_instructions: string;
            show_ads?: boolean;
        };
        services: { id: string, name: string, slug: string, status: string }[];
        google_ai_api_key?: string;
        whatsapp_access_token?: string;
        whatsapp_phone_number_id?: string;
        latitude?: number;
        longitude?: number;
    };
    subscription: {
        plan_id: string;
        status: string;
        expires_at: string;
    } | null;
}

interface Plan {
    id: string;
    name: string;
    price: number | string;
    description?: string;
    slug?: string;
}

interface Booking {
    id: string;
    customer: { name: string };
    service: { name: string };
    staff?: { name: string };
    appointment_at: string;
    status: string;
    price: number;
}

interface Customer {
    id: string | number;
    name: string;
    phone: string;
    category?: string;
    bookings_count: number;
    created_at: string;
}

interface Service {
    id: string;
    name: string;
    price: number;
    description?: string;
}

interface WorkingHour {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_closed: boolean;
}

const SalonDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<DashboardData | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);

    const [loading, setLoading] = useState(true);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [showHoursModal, setShowHoursModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [selectedStaffForHours, setSelectedStaffForHours] = useState<Staff | null>(null);
    const [tempHours, setTempHours] = useState<WorkingHour[]>([]);
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any>(null);
    const [customerForm, setCustomerForm] = useState({ name: '', phone: '', category: 'جديد' });

    const [serviceForm, setServiceForm] = useState({
        name: '',
        description: '',
        price: '',
        status: 'active'
    });

    const [newBooking, setNewBooking] = useState({
        customer_name: '',
        customer_phone: '',
        service_id: '',
        staff_id: '',
        appointment_at: '',
        payment_method: 'cash'
    });

    const [staffForm, setStaffForm] = useState({
        name: '',
        specialization: '',
        is_active: true
    });

    const [salonForm, setSalonForm] = useState({
        name: '',
        phone: '',
        address: '',
        google_ai_api_key: '',
        whatsapp_access_token: '',
        whatsapp_phone_number_id: '',
        latitude: null as number | null,
        longitude: null as number | null
    });

    const [paymentSettings, setPaymentSettings] = useState({
        accept_cash: true,
        accept_wallet: true,
        accept_instapay: true,
        require_deposit: false,
        deposit_amount: 0,
        payment_instructions: ''
    });
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    
    // التحقق من تفعيل الخدمات
    const isServiceActive = (_slug: string) => {
        // فك الأقفال في بيئة التطوير للمعاينة
        return true; 
        // return (data?.tenant?.services || []).some(s => s.slug === slug && s.status === 'active');
    };
    const [consultantAdvice, setConsultantAdvice] = useState<ConsultantAdvice | null>(null);
    const [loadingConsultant, setLoadingConsultant] = useState(false);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [paymentProof, setPaymentProof] = useState({
        sender_phone: '',
        receipt: null as File | null
    });
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [isBridgeConnected, setIsBridgeConnected] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [manualMode, setManualMode] = useState(() => {
        return localStorage.getItem('whatsapp_manual_mode') === 'true';
    });

    const fetchQR = async () => {
        if (!data?.tenant?.id) return;
        // إذا كنا في حالة إعادة ضبط، لا نتوقف بل نستمر في المحاولة لجلب الكود الجديد فور توفره
        try {
            const response = await axios.get(`http://localhost:9000/status/${data.tenant.id}`);
            if (response.data.connected) {
                setIsBridgeConnected(true);
                setQrCode(null);
                setManualMode(false);
                localStorage.setItem('whatsapp_manual_mode', 'false');
                setIsResetting(false); // التأكد من إنهاء حالة إعادة الضبط
            } else if (response.data.qr) {
                setQrCode(response.data.qr);
                setIsBridgeConnected(false);
                setIsResetting(false); // الكود ظهر، انتهت إعادة الضبط
            } else {
                // السيرفر يعمل ولكن لم يولد كود بعد
                if (!isResetting) {
                    setIsBridgeConnected(false);
                    setQrCode(null);
                }
            }
        } catch (error) {
            // صمت عند الخطأ
        }
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/me');
                const dashboardData = response.data;
                setData(dashboardData);

                if (dashboardData.tenant) {
                    setSalonForm({
                        name: dashboardData.tenant.name || '',
                        phone: dashboardData.tenant.phone || '',
                        address: dashboardData.tenant.address || '',
                        google_ai_api_key: dashboardData.tenant.google_ai_api_key || '',
                        whatsapp_access_token: dashboardData.tenant.whatsapp_access_token || '',
                        whatsapp_phone_number_id: dashboardData.tenant.whatsapp_phone_number_id || '',
                        latitude: dashboardData.tenant.latitude || null,
                        longitude: dashboardData.tenant.longitude || null
                    });

                    if (dashboardData.tenant.settings) {
                        setPaymentSettings({
                            accept_cash: dashboardData.tenant.settings.accept_cash ?? true,
                            accept_wallet: dashboardData.tenant.settings.accept_wallet ?? true,
                            accept_instapay: dashboardData.tenant.settings.accept_instapay ?? true,
                            require_deposit: dashboardData.tenant.settings.require_deposit ?? false,
                            deposit_amount: dashboardData.tenant.settings.deposit_amount ?? 0,
                            payment_instructions: dashboardData.tenant.settings.payment_instructions ?? ''
                        });
                    }
                }

                // جلب الخطط المتاحة
                const plansRes = await api.get('/plans');
                setPlans(plansRes.data.data);

                try {
                    // جلب الحجوزات الحقيقية
                    const bookingsRes = await api.get('/bookings');
                    setBookings(bookingsRes.data.data);

                    // جلب الخدمات المتاحة للصالون
                    const servicesRes = await api.get('/services');
                    setServices(servicesRes.data.data || []);

                    // جلب قائمة العملاء
                    const customersRes = await api.get('/customers');
                    setCustomers(customersRes.data.data || []);

                    // جلب قائمة الموظفين
                    const staffRes = await api.get('/staff');
                    setStaff(staffRes.data.data || []);
                } catch (subErr: unknown) {
                    if ((subErr as any).response?.status === 402 || (subErr as any).response?.status === 403) {
                        toast.error("يرجى تفعيل اشتراكك للوصول إلى كافة ميزات المنصة", { icon: '🔒' });
                        setActiveTab('billing'); // Redirect unpaid users to billing
                    }
                }
            } catch (error) {
                console.error("خطأ في جلب بيانات اللوحة:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();

        // Fetch QR Code for AI Linking - تسريع الطلب ليكون كل ثانيتين
        const qrInterval = setInterval(fetchQR, 2000);
        return () => clearInterval(qrInterval);
    }, [isResetting, manualMode, isBridgeConnected]);

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

    // حساب أيام الأسبوع بناءً على التاريخ الحالي
    const getDaysInWeek = (date: Date) => {
        const start = new Date(date);
        start.setDate(date.getDate() - date.getDay()); // البداية من الأحد
        return Array.from({ length: 7 }, (_, i) => {
            const day = new Date(start);
            day.setDate(start.getDate() + i);
            return day;
        });
    };

    const weekDays = getDaysInWeek(currentDate);
    const nextWeek = () => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)));
    const prevWeek = () => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)));

    const handleBookingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await api.post('/bookings', newBooking);
            setBookings([response.data.data, ...bookings]);
            setShowBookingModal(false);
            setNewBooking({ customer_name: '', customer_phone: '', service_id: '', staff_id: '', appointment_at: '', payment_method: 'cash' });
            toast.success('✅ تم إضافة الحجز بنجاح! سيصلك تأكيد عبر واتساب.');
        } catch (error: unknown) {
            console.error("خطأ في إنشاء الحجز:", error);
            const message = (error as any).response?.data?.message || "فشل في إنشاء الحجز";
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStaffSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingStaff) {
                const response = await api.put(`/staff/${editingStaff.id}`, staffForm);
                setStaff(prev => prev.map(s => s.id === editingStaff.id ? response.data.data : s));
                toast.success('✅ تم تحديث بيانات الموظف');
            } else {
                const response = await api.post('/staff', staffForm);
                setStaff([...staff, response.data.data]);
                toast.success('✅ تم إضافة الموظف بنجاح');
            }
            setShowStaffModal(false);
            setEditingStaff(null);
            setStaffForm({ name: '', specialization: '', is_active: true });
        } catch (error: unknown) {
            const message = (error as any).response?.data?.message || "فشل حفظ بيانات الموظف";
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openWorkingHours = async (s: Staff | null) => {
        setSelectedStaffForHours(s);
        try {
            const res = await api.get(`/working-hours${s ? `?staff_id=${s.id}` : ''}`);
            if (res.data.data.length === 0) {
                setTempHours(Array.from({ length: 7 }, (_, i) => ({
                    day_of_week: i,
                    start_time: '09:00:00',
                    end_time: '18:00:00',
                    is_closed: false
                })));
            } else {
                setTempHours(res.data.data);
            }
            setShowHoursModal(true);
        } catch (error) {
            toast.error("فشل تحميل ساعات العمل");
        }
    };

    const handleHoursSave = async () => {
        setIsSubmitting(true);
        try {
            await api.post('/working-hours', { staff_id: selectedStaffForHours?.id || null, hours: tempHours });
            toast.success("✅ تم حفظ ساعات العمل بنجاح");
            setShowHoursModal(false);
        } catch (error) {
            toast.error("فشل حفظ ساعات العمل");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCustomerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingCustomer) {
                const res = await api.put(`/customers/${editingCustomer.id}`, customerForm);
                setCustomers(customers.map(c => c.id === editingCustomer.id ? { ...c, ...res.data.data } : c));
                toast.success('✅ تم تحديث بيانات العميل');
            } else {
                const res = await api.post('/customers', customerForm);
                setCustomers([{ ...res.data.data, bookings_count: 0 }, ...customers]);
                toast.success('✅ تم إضافة العميل بنجاح');
            }
            setShowCustomerModal(false);
            setCustomerForm({ name: '', phone: '', category: 'جديد' });
            setEditingCustomer(null);
        } catch (error: any) {
            const message = error.response?.data?.message || "فشل العملية";
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCustomerDelete = async (id: string | number) => {
        if (!confirm('هل أنت متأكد من حذف هذا العميل؟ سيتم حذف سجلاته من النظام.')) return;
        try {
            await api.delete(`/customers/${id}`);
            setCustomers(customers.filter(c => c.id !== id));
            toast.success('تم حذف العميل بنجاح');
        } catch (error) {
            toast.error('فشل في حذف العميل');
        }
    };

    const handleServiceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingService) {
                const res = await api.put(`/services/${editingService.id}`, serviceForm);
                setServices(prev => prev.map(s => s.id === editingService.id ? res.data.data : s));
                toast.success('✅ تم تحديث الخدمة بنجاح');
            } else {
                const res = await api.post('/services', { ...serviceForm, tenant_id: data?.tenant.id, target_audience: 'salon', pricing_type: 'free' });
                setServices([...services, res.data.data]);
                toast.success('✅ تم إضافة الخدمة بنجاح');
            }
            setShowServiceModal(false);
            setEditingService(null);
            setServiceForm({ name: '', description: '', price: '', status: 'active' });
        } catch (error: unknown) {
            toast.error("فشل حفظ بيانات الخدمة");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteService = async (id: string) => {
        if (!window.confirm("هل أنت متأكد من حذف هذه الخدمة؟ سيتم إزالتها من نظام الحجز.")) return;
        try {
            await api.delete(`/services/${id}`);
            setServices(prev => prev.filter(s => s.id !== id));
            toast.success("تم حذف الخدمة");
        } catch (error) {
            toast.error("فشل حذف الخدمة");
        }
    };

    const handleSettingsSave = async () => {
        setIsSubmitting(true);
        try {
            await api.put('/salon/settings', {
                ...salonForm,
                settings: paymentSettings
            });
            toast.success("✅ تم حفظ الإعدادات بنجاح");
        } catch (error: unknown) {
            const message = (error as any).response?.data?.message || "فشل حفظ الإعدادات";
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchWillAIAdvice = async () => {
        setLoadingConsultant(true);
        try {
            const response = await api.get('/ai/will-ai');
            setConsultantAdvice(response.data.advice);
            toast.success("✅ تم استقبال تقرير Will AI بنجاح");
        } catch (error: unknown) {
            const message = (error as any).response?.data?.message || "فشل الحصول على نصيحة Will AI";
            toast.error(message);
        } finally {
            setLoadingConsultant(false);
        }
    };

    const toggleStaffStatus = async (s: Staff) => {
        await api.patch(`/staff/${s.id}/status`, { is_active: !s.is_active });
        setStaff(prev => prev.map(item => item.id === s.id ? { ...item, is_active: !item.is_active } : item));
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentProof.receipt) {
            toast.error("يرجى إرفاق صورة إيصال التحويل");
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        if (selectedPlan) {
            formData.append('plan_id', selectedPlan.id);
            formData.append('amount', String(selectedPlan.price));
        }
        formData.append('payment_method', 'vodafone_cash');
        formData.append('sender_phone', paymentProof.sender_phone);
        if (paymentProof.receipt) {
            formData.append('receipt', paymentProof.receipt);
        }

        try {
            await api.post('/payments/manual', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("✅ تم إرسال إثبات الدفع! سيتم تفعيل حسابك خلال دقائق بعد مراجعة التحويل.");
            setShowPaymentModal(false);
            setPaymentProof({ sender_phone: '', receipt: null });
        } catch (error: unknown) {
            const errorMessage = (error as any).response?.data?.message || "فشل إرسال إثبات الدفع";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateBookingStatus = async (bookingId: string, newStatus: string) => {
        try {
            await api.patch(`/bookings/${bookingId}/status`, { status: newStatus });

            // تحديث الحالة محلياً في الـ state لتجنب إعادة التحميل كاملة
            setBookings(prev => prev.map(b =>
                b.id === bookingId ? { ...b, status: newStatus } : b
            ));

            // رسالة تأكيد بالواتساب
            const statusMessages: Record<string, string> = {
                confirmed: '✅ تم تأكيد الحجز وسيصلك إشعار واتساب',
                cancelled: '❌ تم إلغاء الحجز',
                completed: '🎉 تم إكمال الحجز',
                pending: '⏳ تم تغيير الحالة إلى قيد الانتظار'
            };
            toast.success(statusMessages[newStatus] || `تم تحديث الحجز إلى ${newStatus}`);
        } catch {
            toast.error("حدث خطأ أثناء تحديث حالة الحجز");
        }
    };


    // حساب الإحصائيات المالية من الحجوزات المكتملة
    const calculateRevenue = () => {
        const completedBookings = bookings.filter(b => b.status === 'completed');
        const total = completedBookings.reduce((sum, b) => sum + Number(b.price), 0);
        const monthly = completedBookings.filter(b => {
            const date = new Date(b.appointment_at);
            return date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear();
        }).reduce((sum, b) => sum + Number(b.price), 0);
        return { total, monthly };
    };

    // حساب إحصائيات الأسبوع للرسم البياني
    const getWeeklyStats = () => {
        const stats = Array(7).fill(0);
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0,0,0,0);

        bookings.forEach(b => {
            const bDate = new Date(b.appointment_at);
            if (bDate >= startOfWeek) {
                const day = bDate.getDay();
                stats[day]++;
            }
        });
        return stats;
    };

    const weeklyStats = getWeeklyStats();
    const maxStats = Math.max(...weeklyStats, 1); // لتجنب القسمة على صفر

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c', color: 'white' }}>
            جاري تحميل لوحة التحكم...
        </div>
    );

    return (
        <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen rtl" dir="rtl">
            <div className="bg-orb-1"></div>
            <div className="bg-orb-2"></div>

            {/* TopNavBar */}
            <header className="bg-[#0A0A0C]/80 backdrop-blur-xl border-b border-white/10 shadow-[0_0_20px_rgba(139,92,246,0.1)] flex justify-between items-center px-6 py-4 fixed top-0 left-0 right-0 lg:right-64 z-40 font-sans text-right">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden text-white/70 hover:text-white p-2">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <span className="text-2xl font-black bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">O2O EG</span>
                    <div className="hidden md:flex bg-black/40 rounded-full px-4 py-2 border border-white/10 items-center gap-2">
                        <span className="material-symbols-outlined text-white/40 text-sm">search</span>
                        <input className="bg-transparent border-none focus:ring-0 text-sm w-48 text-right outline-none text-white" placeholder="بحث..." type="text"/>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 text-white/60">
                        <button className="material-symbols-outlined hover:bg-white/10 hover:text-cyan-300 transition-all p-2 rounded-full scale-95 active:scale-90 duration-200">notifications</button>
                        <button onClick={handleLogout} className="material-symbols-outlined hover:bg-white/10 hover:text-red-400 transition-all p-2 rounded-full scale-95 active:scale-90 duration-200">logout</button>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-white leading-none">{data?.user?.name || 'مدير النظام'}</p>
                            <p className="text-[10px] text-white/40 leading-none mt-1">{data?.tenant?.name || 'O2O EG'}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full border border-violet-500/50 bg-violet-500/20 flex items-center justify-center text-violet-300 font-bold">
                            {data?.user?.name?.charAt(0) || 'O'}
                        </div>
                    </div>
                </div>
            </header>

            {/* SideNavBar (Mobile Backdrop) */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* SideNavBar */}
            <aside className={`fixed right-0 top-0 h-full w-64 z-[50] flex flex-col bg-[#0A0A0C]/98 lg:bg-[#0d0d10]/95 backdrop-blur-[60px] border-l border-white/8 shadow-2xl font-sans text-right transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
                
                {/* Brand Header */}
                <div onClick={() => navigate('/')} className="px-6 pt-24 pb-6 border-b border-white/5 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
                            <span className="material-symbols-outlined text-white text-base">spa</span>
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm font-bold text-white line-clamp-1">{data?.tenant?.name || 'مركز التجميل'}</h2>
                            <p className="text-[10px] text-violet-400 font-semibold">O2O EG AI Hub</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
                    
                    {/* --- Group 1: Core Management --- */}
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-3 pb-2 pt-2">الإدارة الأساسية</p>
                    {[
                        { tab: 'overview' as const, icon: 'grid_view', label: 'لوحة التحكم' },
                        { tab: 'calendar' as const, icon: 'calendar_today', label: 'التقويم والمواعيد' },
                    ].map(item => (
                        <button key={item.tab}
                            onClick={() => { setActiveTab(item.tab); setSidebarOpen(false); }}
                            className={`w-full text-right flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${
                                activeTab === item.tab
                                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                                    : 'text-white/40 hover:text-white/80 hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                            <span className="text-xs font-bold">{item.label}</span>
                        </button>
                    ))}

                    {/* --- Group 2: Salon Operations --- */}
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-3 pb-2 pt-4">العمليات والتشغيل</p>
                    {[
                        { tab: 'customers' as const, icon: 'group', label: 'قاعدة العملاء' },
                        { tab: 'staff' as const, icon: 'person_add', label: 'إدارة الموظفين' },
                        { tab: 'services' as const, icon: 'category', label: 'قائمة الخدمات' },
                    ].map(item => (
                        <button key={item.tab}
                            onClick={() => { setActiveTab(item.tab); setSidebarOpen(false); }}
                            className={`w-full text-right flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${
                                activeTab === item.tab
                                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                                    : 'text-white/40 hover:text-white/80 hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                            <span className="text-xs font-bold">{item.label}</span>
                        </button>
                    ))}

                    {/* --- Group 3: O2O B2B Market --- */}
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-3 pb-2 pt-4">سوق O2O للجملة</p>
                    {[
                        { tab: 'market' as const, icon: 'shopping_bag', label: 'سوق الجملة (B2B)', slug: 'retail-store' },
                        { tab: 'retail-orders' as const, icon: 'local_shipping', label: 'طلبات العملاء (B2C)', slug: 'retail-store' },
                    ].map(item => {
                         const active = isServiceActive(item.slug);
                         return (
                            <button key={item.tab}
                                onClick={() => { if (active) { setActiveTab(item.tab); setSidebarOpen(false); } else { toast.error('هذه الخدمة غير مفعلة في اشتراكك الحالي'); } }}
                                className={`w-full text-right flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 border ${
                                    activeTab === item.tab
                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                                        : active
                                            ? 'text-white/40 hover:text-white/80 hover:bg-white/5 border-transparent'
                                            : 'text-white/10 border-transparent cursor-not-allowed opacity-40'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[18px]">{!active ? 'lock' : item.icon}</span>
                                <span className="text-xs font-bold">{item.label}</span>
                                {active && <span className="mr-auto w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>}
                            </button>
                         );
                    })}

                    {/* --- Group 4: Growth & AI --- */}
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-3 pb-2 pt-4">النمو والذكاء الاصطناعي</p>
                    {[
                        { tab: 'ai' as const, icon: 'auto_awesome', label: 'مستشار Will AI', slug: 'will-ai', color: 'fuchsia' },
                        { tab: 'whatsapp' as const, icon: 'chat', label: 'ربط الواتساب', slug: 'will-ai', color: 'green' },
                        { tab: 'marketing' as const, icon: 'rocket_launch', label: 'استوديو السوشيال ميديا', slug: 'crm', color: 'pink' },
                        { tab: 'crm-marketing' as const, icon: 'target', label: 'AI CRM Marketing', slug: 'crm-marketing', color: 'emerald' },
                    ].map(item => {
                        const active = isServiceActive(item.slug);
                        const isSelected = activeTab === item.tab;
                        
                        // Override active for crm-marketing to show it even if locked, but with lock icon
                        const displayActive = item.tab === 'crm-marketing' ? true : active;
                        const isLocked = item.tab === 'crm-marketing' && !active;

                        return (
                            <button key={item.tab}
                                onClick={() => { 
                                    if (displayActive) { 
                                        setActiveTab(item.tab); 
                                        setSidebarOpen(false); 
                                    } else { 
                                        toast.error('خدمة الذكاء الاصطناعي هذه غير مفعلة'); 
                                    } 
                                }}
                                className={`w-full text-right flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 border ${
                                    isSelected
                                        ? `bg-${item.color}-600/20 text-${item.color}-300 border-${item.color}-500/30 shadow-[0_0_15px_rgba(192,38,211,0.15)]`
                                        : displayActive
                                            ? `text-white/40 hover:text-white/80 hover:bg-white/5 border-transparent`
                                            : 'text-white/10 border-transparent cursor-not-allowed opacity-40'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[18px]">{isLocked ? 'lock' : item.icon}</span>
                                <span className="text-xs font-bold">{item.label}</span>
                                {active && item.tab === 'marketing' && <span className="mr-auto text-[8px] bg-pink-500/20 px-1.5 py-0.5 rounded-full">AI</span>}
                                {isLocked && <span className="mr-auto text-[8px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded-full">PRO</span>}
                            </button>
                        );
                    })}

                    {/* --- Group 5: Account & Settings --- */}
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-3 pb-2 pt-4">الحساب والإعدادات</p>
                    {[
                        { tab: 'billing' as const, icon: 'account_balance_wallet', label: 'الاشتراك والفوترة' },
                        { tab: 'settings' as const, icon: 'settings', label: 'إعدادات الصالون' },
                    ].map(item => (
                        <button key={item.tab}
                            onClick={() => { setActiveTab(item.tab); setSidebarOpen(false); }}
                            className={`w-full text-right flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${
                                activeTab === item.tab
                                    ? 'bg-white/10 text-white border border-white/20'
                                    : 'text-white/40 hover:text-white/80 hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                            <span className="text-xs font-bold">{item.label}</span>
                        </button>
                    ))}

                </nav>

                {/* Store Link */}
                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={() => window.open(`/salon/${data?.tenant?.id}`, '_blank')}
                        className="w-full py-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-cyan-500/20 transition-all"
                    >
                        <span className="material-symbols-outlined text-sm">storefront</span>
                        فتح متجري العام
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="lg:mr-64 pt-28 pb-32 px-4 md:px-8">
                <div className="max-w-7xl mx-auto">
                    {activeTab === 'overview' ? (
                        <>
                            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                                <div>
                                    <h1 className="font-h1 text-h1 text-white mb-2">لوحة تحكم مركز الجمال بالذكاء الاصطناعي</h1>
                                    <p className="text-body-lg font-body-lg text-white/60">مرحباً {data?.user?.name?.split(' ')[0] || 'بك'}، إليك ملخص الأداء لليوم</p>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowBookingModal(true)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold text-sm shadow-lg shadow-violet-600/20 hover:scale-105 transition-transform active:scale-95">
                                        <span className="material-symbols-outlined text-sm">add</span>
                                        حجز داخلي
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const url = `${window.location.origin}/salon/${data?.tenant?.id}`;
                                            navigator.clipboard.writeText(url);
                                            toast.success('تم نسخ رابط المتجر لمشاركته مع العملاء!');
                                        }}
                                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold text-sm hover:bg-cyan-500/20 transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                                    >
                                        <span className="material-symbols-outlined text-sm">content_copy</span>
                                        نسخ رابط المتجر
                                    </button>
                                    <button 
                                        onClick={() => window.open(`/salon/${data?.tenant?.id}`, '_blank')}
                                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                                        فتح المتجر العام
                                    </button>
                                </div>
                            </header>

                            <AdContainer showAds={data?.tenant?.settings?.show_ads !== false} />

                            {/* Bento Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                {/* Stat Card: Revenue */}
                                <div className="md:col-span-4 glass rounded-xl p-6 flex flex-col justify-between neon-glow-purple group hover:border-violet-500/40 transition-all">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400">
                                            <span className="material-symbols-outlined">payments</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">إجمالي الإيرادات (المكتملة)</p>
                                        <h3 className="text-3xl font-bold text-white">{calculateRevenue().total.toLocaleString('ar-EG')} <span className="text-sm font-normal text-white/40">ج.م</span></h3>
                                    </div>
                                </div>

                                {/* Stat Card: AI Leads */}
                                <div className="md:col-span-4 glass rounded-xl p-6 flex flex-col justify-between ai-pulse group hover:border-cyan-400/60 transition-all">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 rounded-xl bg-cyan-400/10 text-cyan-400">
                                            <span className="material-symbols-outlined">psychology</span>
                                        </div>
                                        <span className="text-xs font-bold text-cyan-400 flex items-center gap-1 bg-cyan-400/10 px-2 py-1 rounded-full">
                                            نشط الآن
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">إجمالي العملاء</p>
                                        <h3 className="text-3xl font-bold text-white">{customers.length}</h3>
                                    </div>
                                </div>

                                {/* Stat Card: Bookings */}
                                <div className="md:col-span-4 glass rounded-xl p-6 flex flex-col justify-between hover:border-pink-500/40 transition-all">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400">
                                            <span className="material-symbols-outlined">calendar_today</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">الحجوزات النشطة (قيد الانتظار/مؤكد)</p>
                                        <h3 className="text-3xl font-bold text-white">{bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length}</h3>
                                    </div>
                                </div>

                                {/* Large Chart Card */}
                                <div className="md:col-span-8 glass rounded-xl p-6 min-h-[400px] flex flex-col">
                                    <div className="flex justify-between items-center mb-8">
                                        <div>
                                            <h3 className="text-xl font-bold text-white">تحليلات النمو الذكي</h3>
                                            <p className="text-sm text-white/40">مقارنة بين توقعات AI والأداء الفعلي</p>
                                        </div>
                                    </div>
                                    <div className="flex-grow flex items-end gap-3 px-2 h-48">
                                        {weeklyStats.map((count, idx) => {
                                            const height = (count / maxStats) * 100;
                                            const isPeak = count === Math.max(...weeklyStats) && count > 0;
                                            return (
                                                <div key={idx} 
                                                    style={{ height: `${Math.max(height, 5)}%` }}
                                                    className={`flex-1 bg-gradient-to-t ${isPeak ? 'from-cyan-500/40 to-cyan-500/60 ai-pulse' : 'from-violet-500/20 to-violet-500/40'} rounded-t-lg relative group transition-all duration-500`}
                                                >
                                                    {isPeak && (
                                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-cyan-400 text-black px-2 py-1 rounded text-[10px] font-bold shadow-lg shadow-cyan-400/40 whitespace-nowrap">الذروة الأسبوعية</div>
                                                    )}
                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-white/40 opacity-0 group-hover:opacity-100 transition-opacity font-bold">{count}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-between mt-4 text-[10px] text-white/40 font-bold px-2">
                                        <span>الأحد</span><span>الاثنين</span><span>الثلاثاء</span><span>الأربعاء</span><span>الخميس</span><span>الجمعة</span><span>السبت</span>
                                    </div>
                                </div>

                                {/* Recent Bookings List */}
                                <div className="md:col-span-4 glass rounded-xl p-6 flex flex-col">
                                    <h3 className="text-xl font-bold text-white mb-6">الحجوزات القادمة اليوم</h3>
                                    <div className="space-y-4 overflow-y-auto max-h-[320px] pr-2 custom-scrollbar">
                                        {bookings.filter(b => new Date(b.appointment_at).toDateString() === new Date().toDateString()).map(booking => (
                                            <div key={booking.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-violet-500/30 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold">
                                                        {booking.customer.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-white leading-tight">{booking.customer.name}</p>
                                                        <p className="text-[10px] text-white/40 leading-tight mt-1">{booking.service.name}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-violet-400">{new Date(booking.appointment_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                                                    <select
                                                        value={booking.status}
                                                        onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                                                        className="mt-1 bg-black/40 border border-white/10 rounded text-[10px] text-white px-1 outline-none"
                                                    >
                                                        <option value="pending">انتظار</option>
                                                        <option value="confirmed">تأكيد</option>
                                                        <option value="cancelled">إلغاء</option>
                                                        <option value="completed">اكتمل</option>
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                        {bookings.filter(b => new Date(b.appointment_at).toDateString() === new Date().toDateString()).length === 0 && (
                                            <div className="text-center text-white/40 text-sm py-8">لا يوجد حجوزات لليوم.</div>
                                        )}
                                    </div>
                                    <button onClick={() => setActiveTab('calendar')} className="w-full mt-auto pt-4 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors">عرض جميع المواعيد</button>
                                </div>

                                {/* Featured AI Card */}
                                <div className="md:col-span-12 glass rounded-xl p-6 bg-gradient-to-br from-violet-600/10 to-transparent border-violet-500/20 relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 blur-[80px] -z-10"></div>
                                    <div className="md:w-2/3">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="bg-cyan-400 text-black px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">Will AI Assistant</div>
                                        </div>
                                        <h2 className="text-2xl font-bold text-white mb-4">احصل على استشارات ذكية لنمو صالونك</h2>
                                        <p className="text-sm text-white/60 mb-6 max-w-2xl">
                                            مستشارك الذكي المدعوم بـ Google Gemini يحلل بيانات عملائك ويقترح لك عروض تسويقية وأفكار لزيادة أرباحك بناءً على سلوك عملائك.
                                        </p>
                                        <div className="flex gap-4">
                                            <button onClick={() => setActiveTab('ai')} className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all text-sm shadow-lg">التحدث مع المستشار</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : activeTab === 'ai' ? (
                        <div className="p-8">
                            <h2 className="text-3xl font-black text-white mb-2">مستشار Will AI الاستراتيجي</h2>
                            <p className="text-slate-400 mb-8">تحليل ذكي لبيانات صالونك لزيادة المبيعات وتطوير الأداء.</p>
                            
                            {/* AI Consultant Content */}
                            <div className="bg-slate-900 border border-indigo-500/20 rounded-3xl p-10 relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-2xl">
                                            <Sparkles size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">Will AI</h2>
                                            <p className="text-slate-400 text-sm">مستشارك الاستراتيجي الذكي لنمو الصالون</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl">
                                            <p className="text-slate-300 text-sm mb-2">كيف تزيد أرباحك؟</p>
                                            <p className="text-slate-500 text-xs">سيقوم الذكاء الاصطناعي بتحليل خدماتك ومبيعاتك واقتراح خطة زيادة أسعار أو عروض تسويقية.</p>
                                        </div>
                                        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl">
                                            <p className="text-slate-300 text-sm mb-2">تحسين جدول المواعيد</p>
                                            <p className="text-slate-500 text-xs">تحليل أوقات الفراغ واقتراح "Happy Hour" لملء الجدول.</p>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={fetchWillAIAdvice}
                                        disabled={loadingConsultant}
                                        className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {loadingConsultant ? (
                                            <>جاري تحليل البيانات...</>
                                        ) : (
                                            <>ابدأ الاستشارة الآن <ChevronLeft size={20} /></>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {consultantAdvice && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-slate-900 border border-slate-800 p-8 rounded-3xl mt-8"
                                >
                                    <div className="flex items-center gap-2 mb-8 text-indigo-400">
                                        <Sparkles size={24} />
                                        <h3 className="font-bold text-2xl">{consultantAdvice?.title || 'تقرير Will AI الاستراتيجي لصالونك'}</h3>
                                    </div>
                                    
                                    <div className="space-y-8 text-right" dir="rtl">
                                        {consultantAdvice?.setup_warning && (
                                            <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 p-4 rounded-xl text-sm font-bold">
                                                {consultantAdvice.setup_warning}
                                            </div>
                                        )}

                                        {/* 1. الملخص التنفيذي */}
                                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                                            <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-indigo-400">psychology</span>
                                                الرؤية العامة
                                            </h4>
                                            <p className="text-slate-300 leading-relaxed text-lg italic">
                                                {consultantAdvice.summary}
                                            </p>
                                        </div>

                                        {/* 2. رؤى البيانات */}
                                        {consultantAdvice.data_insights && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-2xl">
                                                    <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest block mb-1">أكبر فرصة نمو</span>
                                                    <p className="text-white font-bold">{consultantAdvice.data_insights.growth_opportunity}</p>
                                                </div>
                                                <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl">
                                                    <span className="text-xs text-emerald-400 font-bold uppercase tracking-widest block mb-1">خدمة التركيز هذا الأسبوع</span>
                                                    <p className="text-white font-bold">{consultantAdvice.data_insights.target_service}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* 3. العرض المقترح و Sales Hack */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {consultantAdvice.suggested_offer && (
                                                <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl">
                                                    <h4 className="text-amber-400 font-bold mb-2 flex items-center gap-2">
                                                        <span className="material-symbols-outlined">local_offer</span>
                                                        عرض مقترح
                                                    </h4>
                                                    <p className="text-white font-bold text-sm mb-1">{consultantAdvice.suggested_offer.title}</p>
                                                    <p className="text-slate-400 text-[11px]">{consultantAdvice.suggested_offer.details}</p>
                                                </div>
                                            )}
                                            {consultantAdvice.sales_hack && (
                                                <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl">
                                                    <h4 className="text-rose-400 font-bold mb-2 flex items-center gap-2">
                                                        <span className="material-symbols-outlined">rocket_launch</span>
                                                        فكرة بيعية سريعة (Hack)
                                                    </h4>
                                                    <p className="text-slate-200 text-sm">{consultantAdvice.sales_hack}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* 4. المحتوى الإبداعي (فيسبوك وواتساب) */}
                                        {consultantAdvice.creative_content && (
                                            <div className="space-y-6">
                                                <h4 className="text-white font-bold flex items-center gap-2 mt-4">
                                                    <span className="material-symbols-outlined text-violet-400">campaign</span>
                                                    محتوى تسويقي جاهز للنشر
                                                </h4>
                                                
                                                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="text-violet-300 text-xs font-bold flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-sm">facebook</span> منشور فيسبوك
                                                        </span>
                                                        <button 
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(consultantAdvice.creative_content?.facebook_post || '');
                                                                toast.success('تم نسخ النص');
                                                            }}
                                                            className="text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1 rounded-lg text-white/60 transition-colors"
                                                        >
                                                            نسخ النص
                                                        </button>
                                                    </div>
                                                    <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                                                        {consultantAdvice.creative_content.facebook_post}
                                                    </p>
                                                </div>

                                                <div className="bg-green-500/5 p-6 rounded-2xl border border-green-500/10">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="text-green-400 text-xs font-bold flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-sm">chat</span> رسالة واتساب برودكاست
                                                        </span>
                                                        <button 
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(consultantAdvice.creative_content?.whatsapp_broadcast || '');
                                                                toast.success('تم نسخ الرسالة');
                                                            }}
                                                            className="text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1 rounded-lg text-white/60 transition-colors"
                                                        >
                                                            نسخ النص
                                                        </button>
                                                    </div>
                                                    <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                                                        {consultantAdvice.creative_content.whatsapp_broadcast}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    ) : activeTab === 'whatsapp' ? (
                        <div className="p-8">
                            <h2 className="text-3xl font-black text-white mb-2">ربط مساعد الواتساب</h2>
                            <p className="text-slate-400 mb-8">قم بربط رقم الواتساب الخاص بالصالون ليقوم المساعد بالرد التلقائي والحجز للعملاء.</p>
                            
                            <div className="bg-slate-900 border border-slate-800 p-12 rounded-[3rem] flex flex-col items-center max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-3xl"></div>
                                
                                <div className="w-full text-center mb-8">
                                    {isBridgeConnected ? (
                                        <div className="flex flex-col items-center">
                                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4 border border-green-500/30">
                                                <span className="material-symbols-outlined text-4xl text-green-400">check_circle</span>
                                            </div>
                                            <h3 className="text-2xl font-bold text-white mb-2">المساعد متصل الآن</h3>
                                            <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
                                                رقم الواتساب الخاص بك مرتبط بنجاح وسيقوم المساعد بالرد على كافة رسائل العملاء فوراً.
                                            </p>
                                            
                                            <button 
                                                onClick={async () => { 
                                                    try {
                                                        setIsResetting(true);
                                                        setManualMode(true);
                                                        localStorage.setItem('whatsapp_manual_mode', 'true');
                                                        await axios.post(`http://localhost:9000/logout/${data?.tenant.id}`).catch(() => {});
                                                        setIsBridgeConnected(false);
                                                        setQrCode(null);
                                                        toast.success('تم قطع الاتصال - جاري إعادة تهيئة الجلسة...');
                                                        setTimeout(() => {
                                                            setIsResetting(false);
                                                            setManualMode(false);
                                                            localStorage.setItem('whatsapp_manual_mode', 'false');
                                                            fetchQR();
                                                        }, 3000);
                                                    } catch (e) {
                                                        setIsResetting(false);
                                                    }
                                                }}
                                                className="mt-8 text-red-400 text-xs font-bold border border-red-400/20 px-6 py-2 rounded-xl hover:bg-red-400/5 transition-all"
                                            >
                                                قطع الاتصال بالرقم الحالي
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div className="bg-white p-6 rounded-[2rem] shadow-2xl mb-6">
                                                {qrCode ? (
                                                    <img 
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCode)}`} 
                                                        alt="WhatsApp QR Code" 
                                                        className="w-[250px] h-[250px]"
                                                    />
                                                ) : (
                                                    <div className="w-[250px] h-[250px] flex flex-col items-center justify-center bg-slate-50">
                                                        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                                                        <p className="text-slate-400 text-[10px] font-bold px-8 text-center leading-relaxed">
                                                            {isResetting ? 'جاري مسح الجلسة...' : 'جاري جلب كود الربط من السيرفر...'}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-indigo-400 mb-2">
                                                <span className="material-symbols-outlined text-sm">info</span>
                                                <p className="text-sm font-bold">طريقة الربط:</p>
                                            </div>
                                            <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                                                افتح واتساب على هاتفك &gt; الإعدادات &gt; الأجهزة المرتبطة &gt; ربط جهاز، ثم قم بتوجيه الكاميرا نحو الكود أعلاه.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'market' ? (
                        <B2BMarket />
                    ) : activeTab === 'crm-marketing' ? (
                        <CRMMarketing isLocked={!isServiceActive('crm-marketing')} onUpgrade={() => setActiveTab('billing')} />
                    ) : activeTab === 'settings' ? (
                        <section>
                            <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '2rem' }}>إعدادات الصالون</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', display: 'grid', gap: '1.5rem' }}>
                                    <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>بيانات الصالون الأساسية</h3>
                                    <div>
                                        <label className="form-label text-white/60 text-sm font-bold block mb-2">اسم الصالون</label>
                                        <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500" value={salonForm.name} onChange={e => setSalonForm({ ...salonForm, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="form-label text-white/60 text-sm font-bold block mb-2">رقم هاتف التواصل</label>
                                        <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500" value={salonForm.phone} onChange={e => setSalonForm({ ...salonForm, phone: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="form-label text-white/60 text-sm font-bold block mb-2">العنوان / الموقع</label>
                                        <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500" value={salonForm.address} onChange={e => setSalonForm({ ...salonForm, address: e.target.value })} />
                                    </div>
                                </div>

                                <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', display: 'grid', gap: '1.5rem' }}>
                                    <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>سياسة الدفع والحجز</h3>
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" className="w-5 h-5 rounded accent-violet-500" checked={paymentSettings.accept_cash} onChange={e => setPaymentSettings({ ...paymentSettings, accept_cash: e.target.checked })} />
                                            <span>قبول الدفع نقداً عند الحضور</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" className="w-5 h-5 rounded accent-violet-500" checked={paymentSettings.require_deposit} onChange={e => setPaymentSettings({ ...paymentSettings, require_deposit: e.target.checked })} />
                                            <span>تفعيل مقدم الحجز (Deposit) لضمان الجدية</span>
                                        </label>

                                        {paymentSettings.require_deposit && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                                                <label className="form-label text-white/60 text-sm font-bold block mb-2 mt-4">قيمة المقدم (ج.م)</label>
                                                <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500" value={paymentSettings.deposit_amount} onChange={e => setPaymentSettings({ ...paymentSettings, deposit_amount: Number(e.target.value) })} />
                                            </motion.div>
                                        )}

                                        <div style={{ marginTop: '1rem' }}>
                                            <label className="form-label text-white/60 text-sm font-bold block mb-2">تعليمات الدفع (تظهر للعملاء عند طلب الحجز)</label>
                                            <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500 min-h-[100px]" placeholder="مثال: يرجى تحويل مبلغ المقدم على رقم فودافون كاش..." value={paymentSettings.payment_instructions} onChange={e => setPaymentSettings({ ...paymentSettings, payment_instructions: e.target.value })}></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Google Maps Location Section */}
                            <div className="glass mt-8 p-8 rounded-[32px] border border-white/10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">موقع الصالون الجغرافي</h3>
                                        <p className="text-sm text-white/40">حدد موقعك بدقة على الخريطة ليتمكن العملاء من الوصول إليك بسهولة.</p>
                                    </div>
                                </div>

                                <div className="rounded-[24px] overflow-hidden border border-white/5 mb-4 h-[400px]">
                                    <GoogleMapComponent 
                                        isEditable={true} 
                                        lat={salonForm.latitude || undefined} 
                                        lng={salonForm.longitude || undefined} 
                                        onLocationSelect={(lat, lng) => setSalonForm({...salonForm, latitude: lat, longitude: lng})}
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1 bg-black/40 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[10px] text-white/30 uppercase mb-1">خط العرض (Latitude)</p>
                                        <p className="font-mono text-cyan-400">{salonForm.latitude || 'لم يتم التحديد'}</p>
                                    </div>
                                    <div className="flex-1 bg-black/40 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[10px] text-white/30 uppercase mb-1">خط الطول (Longitude)</p>
                                        <p className="font-mono text-cyan-400">{salonForm.longitude || 'لم يتم التحديد'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end mt-8">
                                <button onClick={handleSettingsSave} disabled={isSubmitting} className="bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold px-8 py-4 rounded-xl hover:scale-105 transition-all">
                                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ كافة الإعدادات'}
                                </button>
                            </div>
                        </section>
                    ) : activeTab === 'staff' ? (
                        <section>
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-3xl font-bold">إدارة الموظفين</h2>
                                <button className="bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold px-6 py-3 rounded-xl hover:scale-105 transition-all" onClick={() => { setEditingStaff(null); setStaffForm({ name: '', specialization: '', is_active: true }); setShowStaffModal(true); }}>
                                    + إضافة موظف
                                </button>
                            </div>
                            <div className="glass rounded-xl overflow-hidden">
                                <table className="w-full text-right">
                                    <thead>
                                        <tr className="border-b border-white/10 bg-white/5">
                                            <th className="p-4 font-bold text-white/60">الاسم</th>
                                            <th className="p-4 font-bold text-white/60">التخصص</th>
                                            <th className="p-4 font-bold text-white/60">الحالة</th>
                                            <th className="p-4 font-bold text-white/60">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {staff.length > 0 ? staff.map(s => (
                                            <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="p-4 font-bold">{s.name}</td>
                                                <td className="p-4 text-white/60">{s.specialization}</td>
                                                <td className="p-4">
                                                    <span onClick={() => toggleStaffStatus(s)} className={`px-3 py-1 rounded-full text-xs cursor-pointer ${s.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                        {s.is_active ? 'نشط' : 'متوقف'}
                                                    </span>
                                                </td>
                                                <td className="p-4 flex gap-3">
                                                    <button onClick={() => { setEditingStaff(s); setStaffForm({ name: s.name, specialization: s.specialization, is_active: s.is_active }); setShowStaffModal(true); }} className="text-violet-400 text-sm hover:text-violet-300">تعديل</button>
                                                    <button onClick={() => openWorkingHours(s)} className="text-cyan-400 text-sm hover:text-cyan-300 flex items-center gap-1"><Clock size={14} />ساعات العمل</button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={4} className="p-8 text-center text-white/40">لا يوجد موظفين مضافين بعد.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    ) : activeTab === 'services' ? (
                        <section>
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-3xl font-bold">خدمات الصالون</h2>
                                <button className="bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold px-6 py-3 rounded-xl hover:scale-105 transition-all" onClick={() => { setEditingService(null); setServiceForm({ name: '', description: '', price: '', status: 'active' }); setShowServiceModal(true); }}>
                                    + إضافة خدمة
                                </button>
                            </div>
                            <div className="glass rounded-xl overflow-hidden">
                                <table className="w-full text-right">
                                    <thead>
                                        <tr className="border-b border-white/10 bg-white/5">
                                            <th className="p-4 font-bold text-white/60">اسم الخدمة</th>
                                            <th className="p-4 font-bold text-white/60">السعر</th>
                                            <th className="p-4 font-bold text-white/60">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {services.length > 0 ? services.map(s => (
                                            <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="p-4 font-bold">{s.name}</td>
                                                <td className="p-4 text-violet-400 font-bold">{s.price} ج.م</td>
                                                <td className="p-4 flex gap-3">
                                                    <button onClick={() => handleDeleteService(s.id)} className="text-red-400 text-sm hover:text-red-300">حذف</button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={3} className="p-8 text-center text-white/40">لا يوجد خدمات مضافة بعد.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    ) : activeTab === 'calendar' ? (
                        <section>
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-3xl font-bold">تقويم الحجوزات</h2>
                                    <div className="flex items-center gap-4 mt-2">
                                        <button onClick={prevWeek} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"><ChevronRight size={20} /></button>
                                        <span className="font-bold">{weekDays[0].toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}</span>
                                        <button onClick={nextWeek} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"><ChevronLeft size={20} /></button>
                                    </div>
                                </div>
                                <button className="bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold px-6 py-3 rounded-xl hover:scale-105 transition-all" onClick={() => setShowBookingModal(true)}>+ إضافة حجز</button>
                            </div>

                            <div className="grid grid-cols-7 gap-4 min-h-[600px]">
                                {weekDays.map((day, idx) => {
                                    const isToday = day.toDateString() === new Date().toDateString();
                                    const dayBookings = bookings.filter(b => new Date(b.appointment_at).toDateString() === day.toDateString());

                                    return (
                                        <div key={idx} className={`glass rounded-xl overflow-hidden flex flex-col ${isToday ? 'border-violet-500 bg-violet-500/5' : ''}`}>
                                            <div className="bg-white/5 p-4 text-center border-b border-white/5">
                                                <div className="text-xs text-white/60 font-bold mb-1">{day.toLocaleDateString('ar-EG', { weekday: 'short' })}</div>
                                                <div className="text-2xl font-bold">{day.getDate()}</div>
                                            </div>
                                            <div className="p-3 flex flex-col gap-3 flex-1 overflow-y-auto">
                                                {dayBookings.length > 0 ? dayBookings.map(b => (
                                                    <div key={b.id} className="bg-gradient-to-br from-violet-600/20 to-pink-600/20 p-3 rounded-lg border border-violet-500/30">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="text-xs font-bold text-violet-300 flex items-center gap-1"><Clock size={12}/> {new Date(b.appointment_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                                                            <select value={b.status} onChange={(e) => updateBookingStatus(b.id, e.target.value)} className="bg-black/50 border border-white/10 rounded px-1 text-[10px] text-white outline-none">
                                                                <option value="pending">انتظار</option><option value="confirmed">تأكيد</option><option value="cancelled">إلغاء</option><option value="completed">اكتمل</option>
                                                            </select>
                                                        </div>
                                                        <div className="font-bold text-sm truncate">{b.customer.name}</div>
                                                        <div className="text-[10px] text-white/60 truncate mt-1">{b.service.name}</div>
                                                    </div>
                                                )) : <div className="text-center text-white/20 text-xs mt-4">لا يوجد</div>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ) : activeTab === 'customers' ? (
                        <section>
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-3xl font-bold">إدارة العملاء</h2>
                                <button 
                                    onClick={() => setShowCustomerModal(true)}
                                    className="bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold px-6 py-3 rounded-xl hover:scale-105 transition-all shadow-lg shadow-violet-600/20"
                                >
                                    + إضافة عميل يدوياً
                                </button>
                            </div>
                            <div className="glass rounded-xl overflow-hidden">
                                <table className="w-full text-right">
                                    <thead>
                                        <tr className="border-b border-white/10 bg-white/5">
                                            <th className="p-4 font-bold text-white/60">الاسم</th>
                                            <th className="p-4 font-bold text-white/60">رقم الهاتف</th>
                                            <th className="p-4 font-bold text-white/60">التصنيف</th>
                                            <th className="p-4 font-bold text-white/60">عدد الحجوزات</th>
                                            <th className="p-4 font-bold text-white/60">تاريخ الانضمام</th>
                                            <th className="p-4 font-bold text-white/60">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customers.length > 0 ? customers.map(customer => (
                                            <tr key={customer.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="p-4 font-bold">{customer.name}</td>
                                                <td className="p-4 text-white/60">{customer.phone}</td>
                                                <td className="p-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                                                        customer.category === 'VIP' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
                                                        customer.category === 'عميل دائم' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                                        customer.category === 'عميل متوقف' ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30' :
                                                        'bg-green-500/20 text-green-400 border border-green-500/30'
                                                    }`}>
                                                        {customer.category || 'جديد'}
                                                    </span>
                                                </td>
                                                <td className="p-4"><span className="bg-violet-500/20 text-violet-300 px-3 py-1 rounded-full text-xs">{customer.bookings_count || 0} حجوزات</span></td>
                                                <td className="p-4 text-white/60 text-sm">{new Date(customer.created_at).toLocaleDateString('ar-EG')}</td>
                                                <td className="p-4 flex gap-3">
                                                    <button 
                                                        onClick={() => {
                                                            setEditingCustomer(customer);
                                                            setCustomerForm({ name: customer.name, phone: customer.phone, category: customer.category || 'جديد' });
                                                            setShowCustomerModal(true);
                                                        }}
                                                        className="text-violet-400 hover:text-violet-300"
                                                    >
                                                        تعديل
                                                    </button>
                                                    <button 
                                                        onClick={() => handleCustomerDelete(customer.id)}
                                                        className="text-red-400 hover:text-red-300"
                                                    >
                                                        حذف
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : <tr><td colSpan={4} className="p-8 text-center text-white/40">لا يوجد عملاء بعد.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    ) : activeTab === 'billing' ? (
                        <section>
                            <header className="mb-10 text-right" dir="rtl">
                                <h2 className="text-3xl font-bold text-white mb-2">الاشتراكات والفوترة</h2>
                                <p className="text-white/60">تحكم في باقة اشتراكك وفعل خدمات الذكاء الاصطناعي</p>
                            </header>

                            {/* Current Subscription Status */}
                            <div className="glass rounded-3xl p-8 mb-10 border-violet-500/20 bg-gradient-to-br from-violet-600/5 to-transparent flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="text-right">
                                    <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-1">الخطة الحالية</p>
                                    <h3 className="text-2xl font-bold text-white mb-2">
                                        {data?.subscription?.plan_id ? (
                                            plans.find(p => p.id === data.subscription?.plan_id)?.name || 'باقة مخصصة'
                                        ) : 'لا يوجد اشتراك نشط'}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="flex items-center gap-1 text-white/40">
                                            <span className="material-symbols-outlined text-sm">event</span>
                                            تاريخ الانتهاء: {data?.subscription?.expires_at ? new Date(data.subscription.expires_at).toLocaleDateString('ar-EG') : '---'}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${data?.subscription?.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {data?.subscription?.status === 'active' ? 'نشط' : 'منتهي / غير مفعل'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => toast.error('تواصل مع الدعم الفني لإلغاء الاشتراك')} className="px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-all text-sm">إلغاء التجديد التلقائي</button>
                                </div>
                            </div>

                            {/* Available Plans Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {plans.map((plan) => (
                                    <div key={plan.id} className={`glass rounded-3xl p-8 flex flex-col relative transition-all duration-300 hover:-translate-y-2 ${data?.subscription?.plan_id === plan.id ? 'border-violet-500 bg-violet-500/5' : 'hover:border-white/20'}`}>
                                        {data?.subscription?.plan_id === plan.id && (
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[10px] font-black px-4 py-1 rounded-full shadow-lg shadow-violet-600/40">
                                                خطة اشتراكك الحالية
                                            </div>
                                        )}
                                        <h4 className="text-xl font-bold text-white mb-2 text-right">{plan.name}</h4>
                                        <div className="flex items-baseline gap-1 mb-6 justify-end">
                                            <span className="text-3xl font-black text-white">{Number(plan.price).toLocaleString()}</span>
                                            <span className="text-sm text-white/40">ج.م / شهر</span>
                                        </div>
                                        <ul className="space-y-4 mb-8 text-right flex-1" dir="rtl">
                                            <li className="flex items-center gap-2 text-sm text-white/70">
                                                <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                                                نظام حجوزات كامل
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-white/70">
                                                <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                                                إدارة موظفين وخدمات
                                            </li>
                                            {plan.id.includes('ai') && (
                                                <li className="flex items-center gap-2 text-sm text-indigo-400 font-bold">
                                                    <span className="material-symbols-outlined text-sm">bolt</span>
                                                    دخول كامل لـ Will AI
                                                </li>
                                            )}
                                        </ul>
                                        <button 
                                            onClick={() => { setSelectedPlan(plan); setShowPaymentModal(true); }}
                                            disabled={data?.subscription?.plan_id === plan.id}
                                            className={`w-full py-4 rounded-2xl font-bold transition-all ${
                                                data?.subscription?.plan_id === plan.id
                                                    ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                                                    : 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg shadow-violet-600/20 hover:scale-105'
                                            }`}
                                        >
                                            {data?.subscription?.plan_id === plan.id ? 'مفعل حالياً' : 'تجديد / ترقية الباقة'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : activeTab === 'retail-orders' ? (
                        <RetailOrdersTab tenantId={data?.tenant.id} />
                    ) : activeTab === 'marketing' ? (
                        <MarketingStudio />
                    ) : (
                        <section className="text-center py-20">
                            <h2 className="text-2xl font-bold mb-4">هذا القسم قيد التطوير</h2>
                            <p className="text-white/60">اختر قسم آخر من القائمة الجانبية.</p>
                        </section>
                    )}
                </div>
            </main>

            {/* BottomNavBar (Mobile Style) */}
            <nav className="fixed bottom-0 left-0 right-0 w-full px-4 z-50 flex justify-center pb-safe mb-6 lg:hidden">
                <div className="bg-black/40 backdrop-blur-[80px] rounded-full border border-white/10 max-w-[600px] w-full mx-auto shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center justify-around py-3 px-6">
                    <button onClick={() => setActiveTab('overview')} className={`flex flex-col items-center justify-center group ${activeTab === 'overview' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'text-white/40 hover:text-white/80'}`}>
                        <span className="material-symbols-outlined transition-transform active:scale-90 duration-300">home</span>
                        <span className="font-['Space_Grotesk'] text-[10px] font-medium mt-1">الرئيسية</span>
                    </button>
                    <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center justify-center group ${activeTab === 'calendar' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'text-white/40 hover:text-white/80'}`}>
                        <span className="material-symbols-outlined transition-transform active:scale-90 duration-300">calendar_month</span>
                        <span className="font-['Space_Grotesk'] text-[10px] font-medium mt-1">المواعيد</span>
                    </button>
                    <button onClick={() => setActiveTab('customers')} className={`flex flex-col items-center justify-center group ${activeTab === 'customers' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'text-white/40 hover:text-white/80'}`}>
                        <span className="material-symbols-outlined transition-transform active:scale-90 duration-300">group</span>
                        <span className="font-['Space_Grotesk'] text-[10px] font-medium mt-1">العملاء</span>
                    </button>
                    <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center justify-center group ${activeTab === 'settings' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'text-white/40 hover:text-white/80'}`}>
                        <span className="material-symbols-outlined transition-transform active:scale-90 duration-300">settings</span>
                        <span className="font-['Space_Grotesk'] text-[10px] font-medium mt-1">الإعدادات</span>
                    </button>
                </div>
            </nav>

            {/* Contextual FAB */}
            <button onClick={() => setActiveTab('ai')} className="fixed bottom-24 left-8 lg:left-12 w-14 h-14 bg-gradient-to-br from-cyan-400 to-violet-600 rounded-full flex items-center justify-center shadow-lg shadow-violet-600/40 hover:scale-110 active:scale-90 transition-all z-40">
                <span className="material-symbols-outlined text-white text-2xl" style={{fontVariationSettings: "'FILL' 1"}}>bolt</span>
            </button>

            {/* Modals from original code are rendered here (hidden by default) */}
            {showBookingModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
                    <div className="glass w-full max-w-lg p-8 rounded-2xl border border-white/10 relative">
                        <button onClick={() => setShowBookingModal(false)} className="absolute top-4 left-4 text-white/60 hover:text-white"><X size={24} /></button>
                        <h3 className="text-2xl font-bold mb-6">إضافة حجز جديد</h3>
                        <form onSubmit={handleBookingSubmit} className="grid gap-4">
                            <div><label className="text-sm font-bold text-white/60 block mb-2">اسم العميل</label><input type="text" required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none" value={newBooking.customer_name} onChange={e => setNewBooking({ ...newBooking, customer_name: e.target.value })} /></div>
                            <div><label className="text-sm font-bold text-white/60 block mb-2">رقم الموبايل</label><input type="tel" required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none" value={newBooking.customer_phone} onChange={e => setNewBooking({ ...newBooking, customer_phone: e.target.value })} /></div>
                            <div>
                                <label className="text-sm font-bold text-white/60 block mb-2">الخدمة</label>
                                <select required className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none" value={newBooking.service_id} onChange={e => setNewBooking({ ...newBooking, service_id: e.target.value })}>
                                    <option value="">اختر الخدمة...</option>
                                    {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.price} ج.م)</option>)}
                                </select>
                            </div>
                            <div><label className="text-sm font-bold text-white/60 block mb-2">موعد الحجز</label><input type="datetime-local" required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none" value={newBooking.appointment_at} onChange={e => setNewBooking({ ...newBooking, appointment_at: e.target.value })} /></div>
                            <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-violet-600 to-pink-600 font-bold py-3 rounded-xl mt-4">{isSubmitting ? 'جاري الحفظ...' : 'تأكيد الحجز'}</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal - إضافة/تعديل موظف */}
            {showStaffModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
                    <div className="glass w-full max-w-lg p-8 rounded-2xl border border-white/10 relative">
                        <button onClick={() => setShowStaffModal(false)} className="absolute top-4 left-4 text-white/60 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                        <h3 className="text-2xl font-bold mb-6">{editingStaff ? 'تعديل موظف' : 'إضافة موظف جديد'}</h3>
                        <form onSubmit={handleStaffSubmit} className="grid gap-4">
                            <div><label className="text-sm font-bold text-white/60 block mb-2">اسم الموظف</label><input type="text" required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none" value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} /></div>
                            <div><label className="text-sm font-bold text-white/60 block mb-2">التخصص</label><input type="text" required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none" value={staffForm.specialization} onChange={e => setStaffForm({ ...staffForm, specialization: e.target.value })} /></div>
                            <label className="flex items-center gap-3 cursor-pointer mt-2">
                                <input type="checkbox" className="w-5 h-5 rounded accent-violet-500" checked={staffForm.is_active} onChange={e => setStaffForm({ ...staffForm, is_active: e.target.checked })} />
                                <span>الموظف نشط حالياً ويستقبل حجوزات</span>
                            </label>
                            <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-violet-600 to-pink-600 font-bold py-3 rounded-xl mt-4">{isSubmitting ? 'جاري الحفظ...' : 'حفظ البيانات'}</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal - إضافة/تعديل خدمة */}
            {showServiceModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
                    <div className="glass w-full max-w-lg p-8 rounded-2xl border border-white/10 relative">
                        <button onClick={() => setShowServiceModal(false)} className="absolute top-4 left-4 text-white/60 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                        <h3 className="text-2xl font-bold mb-6">{editingService ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}</h3>
                        <form onSubmit={handleServiceSubmit} className="grid gap-4">
                            <div><label className="text-sm font-bold text-white/60 block mb-2">اسم الخدمة</label><input type="text" required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none" value={serviceForm.name} onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })} /></div>
                            <div><label className="text-sm font-bold text-white/60 block mb-2">وصف الخدمة</label><textarea className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none" value={serviceForm.description} onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}></textarea></div>
                            <div><label className="text-sm font-bold text-white/60 block mb-2">السعر (ج.م)</label><input type="number" required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none" value={serviceForm.price} onChange={e => setServiceForm({ ...serviceForm, price: e.target.value })} /></div>
                            <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-violet-600 to-pink-600 font-bold py-3 rounded-xl mt-4">{isSubmitting ? 'جاري الحفظ...' : 'حفظ البيانات'}</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal - إدارة ساعات العمل */}
            {showHoursModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
                    <div className="glass w-full max-w-2xl p-8 rounded-2xl border border-white/10 relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setShowHoursModal(false)} className="absolute top-4 left-4 text-white/60 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                        <h3 className="text-2xl font-bold mb-6">ساعات عمل {selectedStaffForHours?.name || 'الصالون'}</h3>
                        <div className="grid gap-3">
                            {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((day, i) => {
                                const hour = tempHours.find(h => h.day_of_week === i) || { day_of_week: i, start_time: '09:00:00', end_time: '18:00:00', is_closed: true };
                                return (
                                    <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                                        <span className="font-bold w-20">{day}</span>
                                        <input type="time" disabled={hour.is_closed} className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white outline-none flex-1" value={hour.start_time.substring(0, 5)} onChange={e => setTempHours(prev => prev.map(h => h.day_of_week === i ? { ...h, start_time: e.target.value + ':00' } : h))} />
                                        <input type="time" disabled={hour.is_closed} className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white outline-none flex-1" value={hour.end_time.substring(0, 5)} onChange={e => setTempHours(prev => prev.map(h => h.day_of_week === i ? { ...h, end_time: e.target.value + ':00' } : h))} />
                                        <label className="flex items-center gap-2 cursor-pointer w-20">
                                            <input type="checkbox" className="accent-red-500" checked={hour.is_closed} onChange={e => {
                                                const val = e.target.checked;
                                                setTempHours(prev => {
                                                    const exists = prev.find(h => h.day_of_week === i);
                                                    if (exists) return prev.map(h => h.day_of_week === i ? { ...h, is_closed: val } : h);
                                                    return [...prev, { day_of_week: i, start_time: '09:00:00', end_time: '18:00:00', is_closed: val }];
                                                });
                                            }} />
                                            <span className="text-sm">مغلق</span>
                                        </label>
                                    </div>
                                );
                            })}
                        </div>
                        <button onClick={handleHoursSave} disabled={isSubmitting} className="w-full bg-gradient-to-r from-violet-600 to-pink-600 font-bold py-3 rounded-xl mt-6">{isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}</button>
                    </div>
                </div>
            )}

            {/* Modal - الدفع والاشتراك */}
            {showPaymentModal && selectedPlan && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
                    <div className="glass w-full max-w-lg p-8 rounded-2xl border border-white/10 relative">
                        <button onClick={() => setShowPaymentModal(false)} className="absolute top-4 left-4 text-white/60 hover:text-white">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                        <h3 className="text-2xl font-bold mb-6 text-right">تفعيل باقة: {selectedPlan.name}</h3>
                        
                        <div className="bg-violet-500/10 border border-violet-500/30 p-5 rounded-2xl mb-6 text-right" dir="rtl">
                            <div className="font-bold text-violet-400 mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">info</span>
                                إرشادات الدفع (فودافون كاش / InstaPay)
                            </div>
                            <div className="space-y-3 text-sm text-white/80">
                                <div className="flex justify-between items-center bg-black/20 p-2 rounded-lg">
                                    <span className="text-white/40">المبلغ المطلوب:</span>
                                    <span className="font-black text-white text-lg">{Number(selectedPlan.price).toLocaleString()} ج.م</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-white/40">رقم فودافون كاش:</span>
                                    <span className="font-bold text-white tracking-widest">01012345678</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-white/40">حساب InstaPay:</span>
                                    <span className="font-bold text-cyan-400">o2oeg@instapay</span>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handlePaymentSubmit} className="grid gap-5 text-right" dir="rtl">
                            <div>
                                <label className="text-xs font-bold text-white/40 block mb-2 mr-1">رقم الهاتف الذي قمت بالتحويل منه</label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="01XXXXXXXXX"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-violet-500 transition-colors" 
                                    value={paymentProof.sender_phone} 
                                    onChange={e => setPaymentProof({ ...paymentProof, sender_phone: e.target.value })} 
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-white/40 block mb-2 mr-1">صورة إيصال التحويل (Screenshot)</label>
                                <div className="relative">
                                    <input 
                                        type="file" 
                                        required 
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-violet-500 transition-colors file:hidden" 
                                        accept="image/*" 
                                        onChange={e => setPaymentProof({ ...paymentProof, receipt: e.target.files?.[0] || null })} 
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                                        <span className="material-symbols-outlined">image</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                disabled={isSubmitting} 
                                className="w-full bg-gradient-to-r from-violet-600 to-pink-600 font-bold py-4 rounded-xl mt-2 shadow-lg shadow-violet-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? 'جاري إرسال البيانات...' : 'تأكيد وإرسال إثبات الدفع'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal - إضافة عميل يدوياً */}
            {showCustomerModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
                    <div className="glass w-full max-w-lg p-8 rounded-2xl border border-white/10 relative">
                        <button onClick={() => { setShowCustomerModal(false); setEditingCustomer(null); }} className="absolute top-4 left-4 text-white/60 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                        <h3 className="text-2xl font-bold mb-6 text-right">{editingCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد يدوياً'}</h3>
                        <form onSubmit={handleCustomerSubmit} className="grid gap-4 text-right" dir="rtl">
                            <div>
                                <label className="text-sm font-bold text-white/60 block mb-2">اسم العميل</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-violet-500" 
                                    value={customerForm.name} 
                                    onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })} 
                                    placeholder="مثال: محمد أحمد"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-white/60 block mb-2">رقم الهاتف (الواتساب)</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-violet-500" 
                                    value={customerForm.phone} 
                                    onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })} 
                                    placeholder="01XXXXXXXXX"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-white/60 block mb-2">تصنيف العميل</label>
                                <select 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-violet-500" 
                                    value={customerForm.category} 
                                    onChange={e => setCustomerForm({ ...customerForm, category: e.target.value })}
                                >
                                    <option value="جديد" className="bg-slate-900">عميل جديد 🆕</option>
                                    <option value="عميل دائم" className="bg-slate-900">عميل دائم ⭐</option>
                                    <option value="VIP" className="bg-slate-900">VIP 💎</option>
                                    <option value="عميل متوقف" className="bg-slate-900">عميل متوقف 💤</option>
                                </select>
                            </div>
                            <button 
                                type="submit" 
                                disabled={isSubmitting} 
                                className="w-full bg-gradient-to-r from-violet-600 to-pink-600 font-bold py-3 rounded-xl mt-4 shadow-lg shadow-violet-600/20"
                            >
                                {isSubmitting ? 'جاري الحفظ...' : (editingCustomer ? 'تحديث البيانات' : 'حفظ بيانات العميل')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalonDashboard;
