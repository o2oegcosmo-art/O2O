import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import api from '../api/config';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
// QR Code library removed for stability - using API instead
import B2BMarket from '../components/B2BMarket';
import RetailOrdersTab from '../components/RetailOrdersTab';
import SocialStudioTab from '../components/SalonDashboardTabs/SocialStudioTab';
import CRMMarketing from '../components/CRMMarketing';
import BillingTab from '../components/SalonDashboardTabs/BillingTab';
import SettingsTab from '../components/SalonDashboardTabs/SettingsTab';
import AITab from '../components/SalonDashboardTabs/AITab';
import WhatsappTab from '../components/SalonDashboardTabs/WhatsappTab';
import StaffTab from '../components/SalonDashboardTabs/StaffTab';
import ServicesTab from '../components/SalonDashboardTabs/ServicesTab';
import CalendarTab from '../components/SalonDashboardTabs/CalendarTab';
import CustomersTab from '../components/SalonDashboardTabs/CustomersTab';
import FinanceTab from '../components/SalonDashboardTabs/FinanceTab';
import InventoryTab from '../components/SalonDashboardTabs/InventoryTab';
import OverviewTab from '../components/SalonDashboardTabs/OverviewTab';
import {
    TabType,
    InventoryItem,
    Staff,
    ConsultantAdvice,
    DashboardData,
    Plan,
    Booking,
    Customer,
    Service,
    WorkingHour,
    Expense,
    FinanceStats,
    Transaction
} from '../types/salon';

import { useSalonStore } from '../store/useSalonStore';

const SalonDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { 
        data, loading, activeTab, setActiveTab, fetchDashboardData,
        bookings, services, customers, staff, inventory,
        setBookings, setServices, setCustomers, setInventory
    } = useSalonStore();

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
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [customerForm, setCustomerForm] = useState({ name: '', phone: '', category: 'جديد' });

    // Financial States (Still local as they are tab-specific or modal-specific for now)
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', category: 'general', expense_date: new Date().toISOString().split('T')[0], description: '' });

    const [serviceForm, setServiceForm] = useState<{
        name: string,
        description: string,
        price: string,
        status: string,
        image_file: File | null,
        image_preview: string | null
    }>({
        name: '',
        description: '',
        price: '',
        status: 'active',
        image_file: null,
        image_preview: null
    });

    const [newBooking, setNewBooking] = useState({
        customer_name: '',
        customer_phone: '',
        service_id: '',
        staff_id: '',
        appointment_at: '',
        payment_method: 'cash'
    });

    const [completingBooking, setCompletingBooking] = useState<Booking | null>(null);
    const [finalPrice, setFinalPrice] = useState<string>('');

    const [staffForm, setStaffForm] = useState({
        name: '',
        specialization: '',
        is_active: true
    });

    const [salonForm, setSalonForm] = useState({
        name: '',
        phone: '',
        address: '',
        description: '',
        og_image_url: '',
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
    
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [lockedFeature, setLockedFeature] = useState<{name: string, icon: string, slug: string} | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState(1);
    const [onboardingForm, setOnboardingForm] = useState({
        salon_name: '',
        city: '',
        whatsapp: '',
        opening_time: '09:00',
        closing_time: '21:00',
        first_service: '',
        first_staff: ''
    });

    // التحقق من تفعيل الخدمات وحالتها التطويرية
    const isServiceActive = (slug: string) => {
        if (!slug) return true;
        // Admins can bypass everything
        if (data?.user?.role === 'admin') return true;
        
        // التحقق من الحالة العالمية للخدمة (هل هي في مرحلة البيتا؟)
        const services = data?.tenant?.services || [];
        const globalService = services.find(s => s.slug === slug);
        
        if (globalService && globalService.global_status === 'beta' && !data?.tenant?.has_full_access) {
            return false; // locked because it's beta and tenant has no full access
        }

        if (globalService && globalService.global_status === 'disabled') {
            return false; // locked because it's disabled
        }

        // Owners have access to active services
        if (data?.user?.role === 'owner') return true;
        
        // الخدمات الأساسية المجانية دائماً مفعلة
        const freeServices = ['public-page'];
        if (freeServices.includes(slug)) return true;

        return services.some(s => s.slug === slug && s.status === 'active');
    };

    const handleTabClick = (tab: TabType, slug?: string, label?: string, icon?: string) => {
        if (!slug || isServiceActive(slug)) {
            setActiveTab(tab);
            setIsSidebarOpen(false);
        } else {
            setLockedFeature({ name: label || '', icon: icon || 'lock', slug: slug });
            setShowUpgradeModal(true);
        }
    };

    const [consultantAdvice, setConsultantAdvice] = useState<ConsultantAdvice | null>(null);
    const [adviceLogId, setAdviceLogId] = useState<string | null>(null);
    const [feedbackSent, setFeedbackSent] = useState(false);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [loadingConsultant, setLoadingConsultant] = useState(false);
    const [, setManualMode] = useState(() => {
        return localStorage.getItem('whatsapp_manual_mode') === 'true';
    });

    const fetchQR = useCallback(async () => {
        if (!data?.tenant?.id) return;
        try {
            const response = await axios.get(`/bridge/status/${data.tenant.id}`);
            
            if (response.data.needsInit && !isResetting && activeTab === 'whatsapp') {
                // 🚀 Auto-init session if we are in the WhatsApp tab to show QR immediately
                axios.post(`/bridge/init/${data.tenant.id}`).catch(() => {});
                setIsBridgeConnected(false);
                setQrCode(null);
            } else if (response.data.connected) {
                setIsBridgeConnected(true);
                setQrCode(null);
                setManualMode(false);
                localStorage.setItem('whatsapp_manual_mode', 'false');
                setIsResetting(false);
            } else if (response.data.qr && typeof response.data.qr === 'string') {
                setQrCode(response.data.qr);
                setIsBridgeConnected(false);
                setIsResetting(false);
            } else {
                if (!isResetting) {
                    setIsBridgeConnected(false);
                    setQrCode(null);
                }
            }
        } catch (error: any) {}
    }, [data?.tenant?.id, isResetting]);

    const generateNewQR = async () => {
        if (!data?.tenant?.id) return;
        setIsResetting(true);
        setQrCode(null);
        try {
            await axios.post(`/bridge/init/${data.tenant.id}`);
            toast.success('جاري توليد رمز QR جديد... يرجى الانتظار ثواني');
            setTimeout(() => {
                setIsResetting(false);
                fetchQR();
            }, 2000);
        } catch (e) {
            setIsResetting(false);
            toast.error('فشل في توليد رمز جديد، تأكد من تشغيل الجسر');
        }
    };

    const fetchFinanceData = useCallback(async () => {
        try {
            const [statsRes, expensesRes, transRes] = await Promise.all([
                api.get('/finance/stats'),
                api.get('/finance/expenses'),
                api.get('/finance/transactions')
            ]);
            // Still using local state for finance for now as we transition
        } catch (error) {
            console.error('Failed to fetch finance data');
        }
    }, []);

    const handleExpenseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/finance/expenses', expenseForm);
            toast.success('تم تسجيل المصروف');
            setShowExpenseModal(false);
            setExpenseForm({ title: '', amount: '', category: 'general', expense_date: new Date().toISOString().split('T')[0], description: '' });
            fetchDashboardData(); // Refresh via store
        } catch (error) {
            toast.error('فشل في التسجيل');
        }
    };

    const deleteExpense = async (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;
        try {
            await api.delete(`/finance/expenses/${id}`);
            toast.success('تم الحذف');
            fetchDashboardData();
        } catch (error) {
            toast.error('فشل في الحذف');
        }
    };

    useEffect(() => {
        fetchDashboardData();
        // Check bridge status
        if (data?.tenant?.id) {
            fetchQR();
        }
    }, []);

    useEffect(() => {
        if (data) {
            setSalonForm({
                name: data.tenant.name,
                phone: data.tenant.phone || '',
                address: data.tenant.address || '',
                description: data.tenant.description || '',
                og_image_url: data.tenant.og_image_url || '',
                google_ai_api_key: data.tenant.google_ai_api_key || '',
                whatsapp_access_token: data.tenant.whatsapp_access_token || '',
                whatsapp_phone_number_id: data.tenant.whatsapp_phone_number_id || '',
                latitude: data.tenant.latitude,
                longitude: data.tenant.longitude
            });
            setPaymentSettings(data.tenant.payment_settings || paymentSettings);
            
            if (data.tenant.onboarding_completed === false) {
                setShowOnboarding(true);
            }
        }
    }, [data]);
    
    const fetchWillAIAdvice = async () => {
        setLoadingConsultant(true);
        try {
            const response = await api.get('/ai/will-ai');
            if (response.data.success) {
                setConsultantAdvice(response.data.advice);
                setAdviceLogId(response.data.log_id);
                setAiProvider(response.data.provider || 'local');
                setFeedbackSent(false);
                setFeedbackComment('');
                toast.success("✅ تم استقبال تقرير Will AI بنجاح");
            }
        } catch (error: unknown) {
            const message = (error as any).response?.data?.message || "فشل الحصول على نصيحة Will AI";
            toast.error(message);
        } finally {
            setLoadingConsultant(false);
        }
    };
    const submitAIFeedback = async (type: 'helpful' | 'not_helpful' | 'wrong') => {
        if (!adviceLogId) return;
        try {
            await api.post('/ai/will-ai/feedback', {
                log_id: adviceLogId,
                feedback: type,
                comment: feedbackComment
            });
            toast.success('شكراً لك! تم تسجيل ملاحظاتك لتدريب Will AI.');
            setFeedbackSent(true);
        } catch (e) {
            toast.error('فشل في إرسال التقييم');
        }
    };

    // ✅ useEffect منفصل فقط لتحديث QR
    useEffect(() => {
        const qrInterval = setInterval(fetchQR, 2000);
        return () => clearInterval(qrInterval);
    }, [fetchQR]);

    const handleLogout = async () => {
        try {
            await api.post('/logout');
        } catch (e) {
            console.error(e);
        } finally {
            // 🛡️ Multi-Session Strategy: Only clear salon-specific data
            localStorage.removeItem('o2oeg_token_salon');
            localStorage.removeItem('o2oeg_user_salon');
            sessionStorage.removeItem('o2oeg_token_salon');
            sessionStorage.removeItem('o2oeg_user_salon');
            
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
        if (!window.confirm('هل أنت متأكد من حذف هذا العميل؟ سيتم حذف سجلاته من النظام.')) return;
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
        
        const formData = new FormData();
        formData.append('name', serviceForm.name);
        formData.append('description', serviceForm.description);
        formData.append('price', serviceForm.price);
        formData.append('status', serviceForm.status);
        formData.append('tenant_id', String(data?.tenant?.id));
        formData.append('target_audience', 'salon');
        formData.append('pricing_type', 'free');
        
        if (serviceForm.image_file) {
            formData.append('image', serviceForm.image_file);
        }

        try {
            if (editingService) {
                // Laravel handles PUT with files better using _method: PUT in a POST request
                formData.append('_method', 'PUT');
                const res = await api.post(`/services/${editingService.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setServices(prev => prev.map(s => s.id === editingService.id ? res.data.data : s));
                toast.success('✅ تم تحديث الخدمة بنجاح');
            } else {
                const res = await api.post('/services', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setServices([...services, res.data.data]);
                toast.success('✅ تم إضافة الخدمة بنجاح');
            }
            setShowServiceModal(false);
            setEditingService(null);
            setServiceForm({ name: '', description: '', price: '', status: 'active', image_file: null, image_preview: null });
        } catch (error: any) {
            toast.error(error.response?.data?.message || "فشل حفظ بيانات الخدمة");
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

    const updateBookingStatus = async (bookingId: string, newStatus: string, adjustedPrice?: number) => {
        try {
            const payload: any = { status: newStatus };
            if (adjustedPrice !== undefined) {
                payload.price = adjustedPrice;
            }

            await api.patch(`/bookings/${bookingId}/status`, payload);

            // تحديث الحالة محلياً في الـ state لتجنب إعادة التحميل كاملة
            setBookings(prev => prev.map(b =>
                b.id === bookingId ? { ...b, status: newStatus, price: adjustedPrice ?? b.price } : b
            ));

            // رسالة تأكيد بالواتساب
            const statusMessages: Record<string, string> = {
                confirmed: '✅ تم تأكيد الحجز وسيصلك إشعار واتساب',
                cancelled: '❌ تم إلغاء الحجز',
                completed: '🎉 تم إكمال الحجز بنجاح مع السعر النهائي',
                pending: '⏳ تم تغيير الحالة إلى قيد الانتظار'
            };
            toast.success(statusMessages[newStatus] || `تم تحديث الحجز إلى ${newStatus}`);
            setCompletingBooking(null);
            setFinalPrice('');
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

    const handleOnboardingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // 1. Update Salon Settings
            await api.put('/salon/settings', {
                name: onboardingForm.salon_name || data?.tenant?.name,
                phone: onboardingForm.whatsapp || data?.user?.phone,
                address: onboardingForm.city,
                onboarding_completed: true
            });

            // 2. Create First Service
            await api.post('/services', {
                name: onboardingForm.first_service || 'خدمة عامة',
                description: 'أول خدمة تم إنشاؤها أثناء الإعداد',
                price: 150,
                status: 'active'
            });

            // 3. Create First Staff
            await api.post('/staff', {
                name: onboardingForm.first_staff || 'موظف 1',
                specialization: 'مصفف شعر',
                is_active: true
            });

            toast.success('تم إكمال إعداد الصالون بنجاح!');
            setShowOnboarding(false);
            window.location.reload(); 
        } catch (error: any) {
            console.error('Onboarding Error:', error.response?.data || error);
            toast.error('حدث خطأ أثناء إعداد الصالون، يرجى المحاولة مرة أخرى');
        } finally {
            setIsSubmitting(false);
        }
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

            {/* TopNavBar (Mobile-Premium) */}
            <header className="bg-slate-900/80 backdrop-blur-2xl border-b border-white/5 flex justify-between items-center px-4 py-3 fixed top-0 left-0 right-0 lg:right-64 z-40 transition-all duration-300">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setSidebarOpen(!isSidebarOpen)} 
                        className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white/70 hover:text-white transition-all active:scale-90"
                    >
                        <span className="material-symbols-outlined text-2xl">{isSidebarOpen ? 'close' : 'menu'}</span>
                    </button>
                    <div className="flex flex-col">
                        <span className="text-sm font-black text-white tracking-tighter">O2O EG</span>
                        <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest leading-none">AI Business Platform</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <button className="w-9 h-9 flex items-center justify-center rounded-lg text-white/40 hover:text-cyan-400 hover:bg-cyan-400/10 transition-all">
                            <span className="material-symbols-outlined text-xl">notifications</span>
                        </button>
                        <button onClick={handleLogout} className="w-9 h-9 flex items-center justify-center rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all">
                            <span className="material-symbols-outlined text-xl">logout</span>
                        </button>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600/20 to-pink-600/20 border border-violet-500/30 flex items-center justify-center shadow-lg shadow-violet-600/10">
                        <span className="text-xs font-black text-white uppercase">{data?.user?.name?.charAt(0) || 'O'}</span>
                    </div>
                </div>
            </header>

            {/* Mobile Bottom Navigation Bar (Ultra-Premium) */}
            <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[92%] max-w-md">
                <div className="bg-slate-900/80 backdrop-blur-3xl border border-white/10 px-6 py-3 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex justify-between items-center">
                    <button 
                        onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
                        className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'overview' ? 'text-cyan-400' : 'text-white/30'}`}
                    >
                        <span className="material-symbols-outlined text-[28px]" style={{fontVariationSettings: activeTab === 'overview' ? "'FILL' 1" : "none"}}>grid_view</span>
                        <span className="text-[12px] font-black tracking-tight">الرئيسية</span>
                    </button>
                    
                    <button 
                        onClick={() => { setActiveTab('calendar'); setSidebarOpen(false); }}
                        className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'calendar' ? 'text-cyan-400' : 'text-white/30'}`}
                    >
                        <span className="material-symbols-outlined text-[28px]" style={{fontVariationSettings: activeTab === 'calendar' ? "'FILL' 1" : "none"}}>calendar_today</span>
                        <span className="text-[12px] font-black tracking-tight">المواعيد</span>
                    </button>

                    {/* AI Floating Hub Button */}
                    <div className="relative -mt-14">
                        <div className="absolute inset-0 bg-cyan-400 blur-2xl opacity-30 animate-pulse"></div>
                        <button 
                            onClick={() => { setActiveTab('ai'); setSidebarOpen(false); }}
                            className={`relative w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl ${activeTab === 'ai' ? 'bg-white text-black scale-110' : 'bg-gradient-to-br from-cyan-400 to-violet-600 text-white'}`}
                        >
                            <span className="material-symbols-outlined text-4xl" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
                            <span className="text-[10px] font-black uppercase mt-1">مستشار AI</span>
                        </button>
                    </div>

                    <button 
                        onClick={() => { setActiveTab('whatsapp'); setSidebarOpen(false); }}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'whatsapp' ? 'text-green-400' : 'text-white/30'}`}
                    >
                        <span className="material-symbols-outlined text-[24px]" style={{fontVariationSettings: activeTab === 'whatsapp' ? "'FILL' 1" : "none"}}>chat</span>
                        <span className="text-[10px] font-black uppercase tracking-tighter">WhatsApp</span>
                    </button>

                    <button 
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 ${isSidebarOpen ? 'text-cyan-400' : 'text-white/30'}`}
                    >
                        <span className="material-symbols-outlined text-[24px]">more_horiz</span>
                        <span className="text-[10px] font-black uppercase tracking-tighter">Menu</span>
                    </button>
                </div>
            </div>

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
                
                {/* Premium Brand Header */}
                <div className="px-6 pt-12 pb-8 border-b border-white/5 bg-slate-900/40">
                    <div className="flex items-center justify-between mb-8 lg:hidden">
                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Main Menu</span>
                        <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-all">
                            <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                    </div>

                    <div onClick={() => navigate('/')} className="flex items-center gap-4 cursor-pointer group">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shadow-xl shadow-violet-600/20 group-hover:scale-110 transition-all duration-500">
                            <span className="material-symbols-outlined text-white text-xl">spa</span>
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-base font-black text-white line-clamp-1 group-hover:text-cyan-400 transition-colors">{data?.tenant?.name || 'مركز التجميل'}</h2>
                            <p className="text-[10px] text-violet-400 font-black uppercase tracking-tighter">O2O EG AI HUB</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
                    
                    {/* --- Group 1: Core Management --- */}
                    <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.25em] px-4 pb-3 pt-4 border-b border-white/5 mb-3">الإدارة الأساسية</p>
                    {[
                        { tab: 'overview' as const, icon: 'grid_view', label: 'لوحة التحكم المركزية' },
                        { tab: 'calendar' as const, icon: 'calendar_today', label: 'التقويم والمواعيد', slug: 'smart-booking-system' },
                    ].map(item => (
                        <button key={item.tab}
                            onClick={() => handleTabClick(item.tab, item.slug, item.label, item.icon)}
                            className={`w-full text-right flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                                activeTab === item.tab
                                    ? 'bg-violet-600 text-white shadow-[0_10px_30px_rgba(139,92,246,0.3)]'
                                    : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                            <span className="text-sm font-black tracking-tight">{item.label}</span>
                        </button>
                    ))}

                    {/* --- Group 2: Salon Operations --- */}
                    <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.25em] px-4 pb-3 pt-6 border-b border-white/5 mb-3">العمليات والتشغيل</p>
                    {[
                        { tab: 'customers' as const, icon: 'group', label: 'قاعدة العملاء والولاء', slug: 'crm-system' },
                        { tab: 'staff' as const, icon: 'person_add', label: 'إدارة فريق العمل', slug: 'smart-booking-system' },
                        { tab: 'services' as const, icon: 'category', label: 'قائمة الخدمات والأسعار', slug: 'smart-booking-system' },
                        { tab: 'inventory' as const, icon: 'inventory_2', label: 'المخزن والمستودع', slug: 'smart-booking-system' },
                        { tab: 'finance' as const, icon: 'account_balance', label: 'النظام المالي والأرباح', slug: 'smart-booking-system' },
                    ].map(item => (
                        <button key={item.tab}
                            onClick={() => handleTabClick(item.tab, item.slug, item.label, item.icon)}
                            className={`w-full text-right flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                                activeTab === item.tab
                                    ? 'bg-cyan-500 text-black shadow-[0_10px_30px_rgba(6,182,212,0.3)]'
                                    : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                            <span className="text-sm font-black tracking-tight">{item.label}</span>
                        </button>
                    ))}

                    {/* --- Group 3: O2O B2B Market --- */}
                    <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.25em] px-4 pb-3 pt-6 border-b border-white/5 mb-3">سوق O2O للجملة</p>
                    {[
                        { tab: 'market' as const, icon: 'shopping_bag', label: 'سوق الجملة (B2B)', slug: 'e-commerce' },
                        { tab: 'retail-orders' as const, icon: 'local_shipping', label: 'طلبات العملاء (B2C)', slug: 'e-commerce' },
                    ].map(item => {
                         const active = isServiceActive(item.slug);
                         return (
                            <button key={item.tab}
                                onClick={() => handleTabClick(item.tab, item.slug, item.label, item.icon)}
                                className={`w-full text-right flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 border ${
                                    activeTab === item.tab
                                        ? 'bg-amber-500 text-black shadow-[0_10px_30px_rgba(245,158,11,0.3)]'
                                        : active
                                            ? 'text-white/50 hover:text-white hover:bg-white/5 border-transparent'
                                            : 'text-white/20 border-white/5 bg-black/20'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[22px]">{!active ? 'lock' : item.icon}</span>
                                <span className="text-sm font-black tracking-tight">{item.label}</span>
                                {data?.tenant?.services?.find(s => s.slug === item.slug)?.global_status === 'beta' && (
                                    <span className="mr-auto text-[8px] bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-lg font-black animate-pulse">BETA</span>
                                )}
                                {!active && data?.tenant?.services?.find(s => s.slug === item.slug)?.global_status !== 'beta' && <span className="mr-auto text-[9px] bg-amber-500/20 text-amber-500 px-2 py-1 rounded-lg font-black">PRO</span>}
                                {active && <span className="mr-auto w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>}
                            </button>
                         );
                    })}

                    {/* --- Group 4: Growth & AI --- */}
                    <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.25em] px-4 pb-3 pt-6 border-b border-white/5 mb-3">النمو والذكاء الاصطناعي</p>
                    {[
                        { tab: 'ai' as const, icon: 'auto_awesome', label: 'مستشار Will AI الذكي', slug: 'public-page', color: 'fuchsia' }, // using a free service slug so it's unlocked for everyone
                        { tab: 'whatsapp' as const, icon: 'chat', label: 'ربط مساعد الواتساب', slug: 'smart-booking-system', color: 'green' },
                        { tab: 'marketing' as const, icon: 'rocket_launch', label: 'استوديو السوشيال ميديا', slug: 'crm-system', color: 'pink' },
                        { tab: 'crm-marketing' as const, icon: 'target', label: 'AI CRM Marketing', slug: 'crm-system', color: 'emerald' },
                    ].map(item => {
                        const active = isServiceActive(item.slug);
                        const isSelected = activeTab === item.tab;
                        
                        return (
                            <button key={item.tab}
                                onClick={() => handleTabClick(item.tab, item.slug, item.label, item.icon)}
                                className={`w-full text-right flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 border ${
                                    isSelected
                                        ? `bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.2)]`
                                        : active
                                            ? `text-white/50 hover:text-white hover:bg-white/5 border-transparent`
                                            : 'text-white/20 border-white/5 bg-black/20'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[22px]">{!active ? 'lock' : item.icon}</span>
                                <span className="text-sm font-black tracking-tight">{item.label}</span>
                                {data?.tenant?.services?.find(s => s.slug === item.slug)?.global_status === 'beta' && (
                                    <span className="mr-auto text-[8px] bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-lg font-black animate-pulse">BETA</span>
                                )}
                                {active && item.tab === 'marketing' && <span className="mr-auto text-[9px] bg-pink-500/20 text-pink-400 px-2 py-1 rounded-lg font-black tracking-widest">AI</span>}
                                {!active && data?.tenant?.services?.find(s => s.slug === item.slug)?.global_status !== 'beta' && <span className="mr-auto text-[9px] bg-amber-500/20 text-amber-500 px-2 py-1 rounded-lg font-black">PRO</span>}
                            </button>
                        );
                    })}

                    {/* --- Group 5: Account & Settings --- */}
                    <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.25em] px-4 pb-3 pt-6 border-b border-white/5 mb-3">الحساب والإعدادات</p>
                    {[
                        { tab: 'billing' as const, icon: 'account_balance_wallet', label: 'الاشتراك والفوترة' },
                        { tab: 'settings' as const, icon: 'settings', label: 'إعدادات الصالون العامة' },
                    ].map(item => (
                        <button key={item.tab}
                            onClick={() => { setActiveTab(item.tab); setSidebarOpen(false); }}
                            className={`w-full text-right flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                                activeTab === item.tab
                                    ? 'bg-white text-black shadow-xl shadow-white/10'
                                    : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                            <span className="text-sm font-black tracking-tight">{item.label}</span>
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
            <main className="lg:mr-64 pt-24 pb-32 px-4 sm:px-6 lg:px-8 transition-all duration-300">
                <div className="max-w-[1600px] mx-auto">
                    {activeTab === 'overview' ? (
                        <OverviewTab
                            data={data}
                            setShowBookingModal={setShowBookingModal}
                            calculateRevenue={calculateRevenue}
                            customers={customers}
                            bookings={bookings}
                            weeklyStats={weeklyStats}
                            maxStats={maxStats}
                            updateBookingStatus={updateBookingStatus}
                            setCompletingBooking={setCompletingBooking}
                            setFinalPrice={setFinalPrice}
                            setActiveTab={setActiveTab}
                        />
                    ) : activeTab === 'ai' ? (
                        <AITab
                            aiProvider={aiProvider}
                            fetchWillAIAdvice={fetchWillAIAdvice}
                            loadingConsultant={loadingConsultant}
                            consultantAdvice={consultantAdvice}
                            submitAIFeedback={submitAIFeedback}
                            feedbackSent={feedbackSent}
                            feedbackComment={feedbackComment}
                            setFeedbackComment={setFeedbackComment}
                        />
                    ) : activeTab === 'whatsapp' ? (
                        <WhatsappTab
                            data={data}
                            isBridgeConnected={isBridgeConnected}
                            setIsBridgeConnected={setIsBridgeConnected}
                            isResetting={isResetting}
                            setIsResetting={setIsResetting}
                            setManualMode={setManualMode}
                            qrCode={qrCode}
                            setQrCode={setQrCode}
                            fetchQR={fetchQR}
                            generateNewQR={generateNewQR}
                            pairingMode={pairingMode}
                            setPairingMode={setPairingMode}
                            pairingPhone={pairingPhone}
                            setPairingPhone={setPairingPhone}
                            pairingCode={pairingCode}
                            setPairingCode={setPairingCode}
                            loadingPairingCode={loadingPairingCode}
                            setLoadingPairingCode={setLoadingPairingCode}
                        />
                    ) : activeTab === 'market' ? (
                        <B2BMarket />
                    ) : activeTab === 'retail-orders' ? (
                        <RetailOrdersTab tenantId={data?.tenant?.id} />
                    ) : activeTab === 'crm-marketing' ? (
                        <CRMMarketing isLocked={!isServiceActive('crm-system')} onUpgrade={() => setActiveTab('billing')} />
                    ) : activeTab === 'marketing' ? (
                        <SocialStudioTab />
                    ) : activeTab === 'billing' ? (
                        <BillingTab 
                            data={data}
                            plans={plans}
                            setSelectedPlan={setSelectedPlan}
                            setShowPaymentModal={setShowPaymentModal}
                        />
                    ) : activeTab === 'settings' ? (
                        <SettingsTab
                            salonForm={salonForm}
                            setSalonForm={setSalonForm}
                            paymentSettings={paymentSettings}
                            setPaymentSettings={setPaymentSettings}
                            handleSettingsSave={handleSettingsSave}
                            isSubmitting={isSubmitting}
                        />
                    ) : activeTab === 'staff' ? (
                        <StaffTab
                            staff={staff}
                            setEditingStaff={setEditingStaff}
                            setStaffForm={setStaffForm}
                            setShowStaffModal={setShowStaffModal}
                            toggleStaffStatus={toggleStaffStatus}
                            openWorkingHours={openWorkingHours}
                        />
                    ) : activeTab === 'services' ? (
                        <ServicesTab
                            services={services}
                            inventory={inventory}
                            setEditingService={setEditingService}
                            setServiceForm={setServiceForm}
                            setShowServiceModal={setShowServiceModal}
                            handleDeleteService={handleDeleteService}
                        />
                    ) : activeTab === 'calendar' ? (
                        <CalendarTab
                            prevWeek={prevWeek}
                            nextWeek={nextWeek}
                            weekDays={weekDays}
                            setShowBookingModal={setShowBookingModal}
                            bookings={bookings}
                            updateBookingStatus={updateBookingStatus}
                            setCompletingBooking={setCompletingBooking}
                            setFinalPrice={setFinalPrice}
                            currentDate={currentDate}
                            setCurrentDate={setCurrentDate}
                        />
                    ) : activeTab === 'customers' ? (
                        <CustomersTab
                            setShowCustomerModal={setShowCustomerModal}
                            customers={customers}
                            setEditingCustomer={setEditingCustomer}
                            setCustomerForm={setCustomerForm}
                            handleCustomerDelete={handleCustomerDelete}
                        />
                    ) : activeTab === 'inventory' ? (
                        <InventoryTab />
                    ) : activeTab === 'finance' ? (
                        <FinanceTab
                            setShowExpenseModal={setShowExpenseModal}
                            financeStats={financeStats}
                            transactions={transactions}
                            expenses={expenses}
                            deleteExpense={deleteExpense}
                        />
                    ) : (
                        <section className="text-center py-20">
                            <h2 className="text-2xl font-bold mb-4">هذا القسم قيد التطوير</h2>
                            <p className="text-white/60">اختر قسم آخر من القائمة الجانبية.</p>
                        </section>
                    )}
                </div>
            </main>

            {/* Redundant BottomNavBar removed - Using the consolidated one above */}

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
                            <div>
                                <label className="text-sm font-bold text-white/60 block mb-2">الموظف (مقدم الخدمة)</label>
                                <select required className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none" value={newBooking.staff_id} onChange={e => setNewBooking({ ...newBooking, staff_id: e.target.value })}>
                                    <option value="">اختر الموظف...</option>
                                    {staff.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.name} ({s.specialization})</option>)}
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
                            <div className="flex justify-center mb-4">
                                <div className="relative w-32 h-32 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center group">
                                    {serviceForm.image_preview ? (
                                        <img src={serviceForm.image_preview} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined text-white/20 text-4xl">image</span>
                                    )}
                                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer">
                                        <span className="material-symbols-outlined text-white text-2xl">cloud_upload</span>
                                        <span className="text-[10px] text-white mt-1 font-bold">رفع صورة</span>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setServiceForm({...serviceForm, image_file: file, image_preview: reader.result as string});
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>
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
                                إرشادات الدفع (فودافون كاش فقط)
                            </div>
                            <div className="space-y-3 text-sm text-white/80">
                                <div className="flex justify-between items-center bg-black/20 p-2 rounded-lg">
                                    <span className="text-white/40">المبلغ المطلوب:</span>
                                    <span className="font-black text-white text-lg">{Number(selectedPlan.price).toLocaleString()} ج.م</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-white/40">رقم فودافون كاش:</span>
                                    <span className="font-bold text-white tracking-widest text-lg text-cyan-400">01005383435</span>
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


            {/* Expense Modal */}
            {showExpenseModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
                    <div className="glass w-full max-w-lg p-8 rounded-2xl border border-white/10 relative">
                        <button onClick={() => setShowExpenseModal(false)} className="absolute top-4 left-4 text-white/60 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                        <h3 className="text-2xl font-bold mb-6 text-right">تسجيل مصروفات</h3>
                        <form onSubmit={handleExpenseSubmit} className="grid gap-4 text-right" dir="rtl">
                            <div>
                                <label className="text-sm font-bold text-white/60 block mb-2">البيان (ماذا اشتريت؟)</label>
                                <input type="text" required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" value={expenseForm.title} onChange={e => setExpenseForm({ ...expenseForm, title: e.target.value })} placeholder="مثال: فاتورة كهرباء، خامات صبغة..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-bold text-white/60 block mb-2">المبلغ</label>
                                    <input type="number" required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-white/60 block mb-2">التصنيف</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                                        <option value="general">عام</option>
                                        <option value="rent">إيجار</option>
                                        <option value="salaries">رواتب</option>
                                        <option value="supplies">خامات وأدوات</option>
                                        <option value="utility">مرافق (كهرباء/ماء)</option>
                                        <option value="marketing">تسويق</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-white/60 block mb-2">التاريخ</label>
                                <input type="date" required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" value={expenseForm.expense_date} onChange={e => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} />
                            </div>
                            <button type="submit" className="w-full bg-green-600 font-bold py-3 rounded-xl mt-4">حفظ المصروف</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Upgrade Modal */}
            <AnimatePresence>
                {showUpgradeModal && lockedFeature && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[2000] p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                            className="glass w-full max-w-md p-8 rounded-[2.5rem] border border-white/10 text-center relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500"></div>
                            
                            <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                                <span className="material-symbols-outlined text-amber-500 text-4xl">{lockedFeature.icon}</span>
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-2">هذه الميزة مدفوعة (PRO)</h3>
                            <p className="text-white/60 mb-8 leading-relaxed">
                                ميزة <span className="text-amber-400 font-bold">"{lockedFeature.name}"</span> متاحة فقط في الباقات الاحترافية. قم بترقية باقتك الآن لتفعيل كافة أدوات الذكاء الاصطناعي والتسويق.
                            </p>

                            <div className="space-y-3">
                                <button 
                                    onClick={() => { setShowUpgradeModal(false); setActiveTab('billing'); }}
                                    className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-black py-4 rounded-2xl shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">upgrade</span>
                                    ترقية الباقة الآن
                                </button>
                                <button 
                                    onClick={() => setShowUpgradeModal(false)}
                                    className="w-full bg-white/5 text-white/40 font-bold py-4 rounded-2xl hover:bg-white/10 transition-all"
                                >
                                    ربما لاحقاً
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Onboarding Wizard */}
            <AnimatePresence>
                {showOnboarding && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="fixed inset-0 bg-[#060608] z-[3000] flex items-center justify-center p-4 overflow-y-auto"
                    >
                        <div className="max-w-xl w-full py-12">
                            <div className="text-center mb-10">
                                <div className="inline-flex items-center gap-2 bg-violet-500/10 px-4 py-1.5 rounded-full border border-violet-500/20 mb-6">
                                    <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></span>
                                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Salon Setup Wizard</span>
                                </div>
                                <h2 className="text-4xl font-black text-white mb-3">مرحباً بك في O2O EG</h2>
                                <p className="text-white/40">لنقم بإعداد صالونك في دقيقة واحدة لنبدأ العمل فوراً</p>
                            </div>

                            <div className="flex gap-2 mb-8 justify-center">
                                {[1, 2, 3].map(step => (
                                    <div key={step} className={`h-1.5 rounded-full transition-all duration-500 ${onboardingStep >= step ? 'w-12 bg-violet-500' : 'w-4 bg-white/10'}`}></div>
                                ))}
                            </div>

                            <form onSubmit={handleOnboardingSubmit} className="glass p-8 rounded-[2rem] border border-white/5 relative overflow-hidden">
                                {onboardingStep === 1 && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 text-right">
                                        <h4 className="text-xl font-bold text-white mb-6">البيانات الأساسية</h4>
                                        <div>
                                            <label className="text-xs font-bold text-white/40 block mb-2 uppercase tracking-wider">اسم الصالون</label>
                                            <input 
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-violet-500" 
                                                value={onboardingForm.salon_name}
                                                onChange={e => setOnboardingForm({...onboardingForm, salon_name: e.target.value})}
                                                placeholder="مثال: لوميير بيوتي سنتر"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-white/40 block mb-2 uppercase tracking-wider">المدينة</label>
                                            <input 
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-violet-500" 
                                                value={onboardingForm.city}
                                                onChange={e => setOnboardingForm({...onboardingForm, city: e.target.value})}
                                                placeholder="القاهرة، المهندسين..."
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-white/40 block mb-2 uppercase tracking-wider">رقم الواتساب للتواصل</label>
                                            <input 
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-violet-500" 
                                                value={onboardingForm.whatsapp}
                                                onChange={e => setOnboardingForm({...onboardingForm, whatsapp: e.target.value})}
                                                placeholder="010XXXXXXXX"
                                            />
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setOnboardingStep(2)}
                                            className="w-full bg-violet-600 py-4 rounded-2xl font-bold text-white hover:bg-violet-700 transition-all"
                                        >
                                            التالي
                                        </button>
                                    </motion.div>
                                )}

                                {onboardingStep === 2 && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 text-right">
                                        <h4 className="text-xl font-bold text-white mb-6">ساعات العمل</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-white/40 block mb-2 uppercase tracking-wider">من الساعة</label>
                                                <input 
                                                    type="time"
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-violet-500" 
                                                    value={onboardingForm.opening_time}
                                                    onChange={e => setOnboardingForm({...onboardingForm, opening_time: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-white/40 block mb-2 uppercase tracking-wider">إلى الساعة</label>
                                                <input 
                                                    type="time"
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-violet-500" 
                                                    value={onboardingForm.closing_time}
                                                    onChange={e => setOnboardingForm({...onboardingForm, closing_time: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <button 
                                                type="button"
                                                onClick={() => setOnboardingStep(3)}
                                                className="flex-1 bg-violet-600 py-4 rounded-2xl font-bold text-white hover:bg-violet-700 transition-all"
                                            >
                                                التالي
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setOnboardingStep(1)}
                                                className="px-8 bg-white/5 py-4 rounded-2xl font-bold text-white/60 hover:bg-white/10 transition-all"
                                            >
                                                رجوع
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {onboardingStep === 3 && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 text-right">
                                        <h4 className="text-xl font-bold text-white mb-6">الخطوة الأخيرة</h4>
                                        <div>
                                            <label className="text-xs font-bold text-white/40 block mb-2 uppercase tracking-wider">أهم خدمة تقدمها</label>
                                            <input 
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-violet-500" 
                                                value={onboardingForm.first_service}
                                                onChange={e => setOnboardingForm({...onboardingForm, first_service: e.target.value})}
                                                placeholder="مثال: سشوار وبيبي ليس"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-white/40 block mb-2 uppercase tracking-wider">اسم مصفف شعر (موظف)</label>
                                            <input 
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-violet-500" 
                                                value={onboardingForm.first_staff}
                                                onChange={e => setOnboardingForm({...onboardingForm, first_staff: e.target.value})}
                                                placeholder="مثال: أحمد خليل"
                                            />
                                        </div>
                                        <div className="flex gap-4">
                                            <button 
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 py-4 rounded-2xl font-bold text-white hover:scale-105 active:scale-95 transition-all shadow-xl shadow-violet-600/20 disabled:opacity-50"
                                            >
                                                {isSubmitting ? 'جاري الحفظ...' : 'ابدأ استخدام المنصة'}
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setOnboardingStep(2)}
                                                className="px-8 bg-white/5 py-4 rounded-2xl font-bold text-white/60 hover:bg-white/10 transition-all"
                                            >
                                                رجوع
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Price Adjustment Modal */}
            <AnimatePresence>
                {completingBooking && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCompletingBooking(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl text-right" dir="rtl">
                            <h3 className="text-2xl font-black text-white mb-4">إتمام الخدمة وتحصيل المبلغ</h3>
                            <p className="text-slate-400 text-sm mb-6">يرجى التأكد من المبلغ النهائي المدفوع من العميلة قبل إغلاق الحجز.</p>
                            
                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs text-white/40 font-bold uppercase tracking-wider">اسم العميلة</span>
                                        <span className="text-sm font-bold text-white">{completingBooking.customer.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-white/40 font-bold uppercase tracking-wider">الخدمة</span>
                                        <span className="text-sm font-bold text-cyan-400">{completingBooking.service.name}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2 mr-1">المبلغ النهائي المحصل (ج.م)</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-2xl font-black text-emerald-400 outline-none focus:border-emerald-500 transition-all text-center" 
                                        value={finalPrice} 
                                        onChange={e => setFinalPrice(e.target.value)} 
                                        autoFocus
                                    />
                                    <p className="text-[10px] text-white/30 mt-2 text-center">يمكنك تعديل السعر هنا إذا استهلكت العميلة مواد إضافية أو كان شعرها طويلاً.</p>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button 
                                        onClick={() => updateBookingStatus(completingBooking.id, 'completed', Number(finalPrice))}
                                        className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        تأكيد الإتمام والحفظ
                                    </button>
                                    <button 
                                        onClick={() => setCompletingBooking(null)}
                                        className="px-6 py-4 bg-white/5 text-white/60 font-bold rounded-2xl hover:bg-white/10 transition-all"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SalonDashboard;
