import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Smartphone, RotateCcw, LogOut, Zap, Play, CheckCircle, AlertTriangle } from 'lucide-react';

const BRIDGE_URL = '/bridge';
const ADMIN_TENANT = '00000000-0000-0000-0000-000000000000';

type PanelState = 'loading' | 'sleep' | 'qr' | 'connected' | 'error';

const WhatsAppAdminPanel: React.FC = () => {
    const [panelState, setPanelState] = useState<PanelState>('loading');
    const [qrImage, setQrImage] = useState<string | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const mountedRef = useRef(true);

    const stopPolling = () => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    };

    const checkStatus = async (): Promise<void> => {
        try {
            // Added cache buster to URL
            const res = await axios.get(`${BRIDGE_URL}/status/${ADMIN_TENANT}?t=${Date.now()}`, { timeout: 5000 });
            if (!mountedRef.current) return;

            if (res.data.connected) {
                setPanelState('connected');
                setQrImage(null);
            } else if (res.data.qr) {
                setPanelState('qr');
                setQrImage(res.data.qr);
            } else {
                setPanelState('sleep');
                setQrImage(null);
            }
        } catch (err) {
            console.error('Status check failed:', err);
            if (mountedRef.current && panelState === 'loading') {
                setPanelState('sleep');
            }
        }
    };

    const startPolling = () => {
        stopPolling();
        pollRef.current = setInterval(async () => {
            if (!mountedRef.current) return;
            await checkStatus();
        }, 5000);
    };

    useEffect(() => {
        mountedRef.current = true;
        checkStatus();
        startPolling();
        return () => {
            mountedRef.current = false;
            stopPolling();
        };
    }, []);

    const handleStartLinking = async () => {
        const loading = toast.loading('جاري تشغيل المحرك...');
        setPanelState('loading');
        try {
            await axios.post(`${BRIDGE_URL}/init/${ADMIN_TENANT}`, {}, { timeout: 15000 });
            toast.success('تم تشغيل المحرك، امسح الكود', { id: loading });
            setTimeout(() => checkStatus(), 2000);
        } catch (err) {
            toast.error('فشل في تشغيل المحرك - تأكد من استجابة السيرفر', { id: loading });
            setPanelState('sleep');
        }
    };

    const handleDisconnect = async (isForce = false) => {
        const loading = toast.loading(isForce ? 'جاري التطهير الشامل...' : 'جاري قطع الاتصال...');
        setPanelState('loading');
        try {
            await axios.post(`${BRIDGE_URL}/logout/${ADMIN_TENANT}`, { force: isForce }, { timeout: 15000 });
            toast.success('تم التطهير بنجاح ✅', { id: loading });
            // After logout, immediately restart linking to get a new QR
            handleStartLinking();
        } catch (err) {
            toast.error('حدث خطأ، ولكن سنحاول البدء من جديد', { id: loading });
            handleStartLinking(); // Try to start anyway
        }
    };

    return (
        <div className="flex flex-col items-center text-center gap-8 py-6 bg-black/20 rounded-[40px] border border-white/5 p-8">

            {/* LOADING STATE */}
            {panelState === 'loading' && (
                <div className="py-16 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-fuchsia-400 font-bold">جاري المزامنة مع السيرفر...</p>
                </div>
            )}

            {/* SLEEP STATE */}
            {panelState === 'sleep' && (
                <div className="py-12 flex flex-col items-center gap-6">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                        <Zap size={36} className="text-white/20" />
                    </div>
                    <div>
                        <p className="text-xl font-black text-white mb-2">المحرك جاهز للإطلاق</p>
                        <p className="text-[10px] text-fuchsia-400 font-black uppercase tracking-[0.2em] mb-4">O2OEG SUPER ADMIN ENGINE</p>
                        <p className="text-sm text-white/40 max-w-[280px]">اضغط الزر أدناه لبدء ربط واتساب الإدارة وتوليد كود الربط</p>
                    </div>
                    <button
                        onClick={handleStartLinking}
                        className="px-12 py-5 bg-fuchsia-600 text-white rounded-[24px] text-base font-black shadow-[0_10px_40px_rgba(192,38,211,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group"
                    >
                        <Play size={20} className="group-hover:translate-x-1 transition-transform" fill="currentColor" />
                        بدء عملية الربط الآن
                    </button>
                </div>
            )}

            {/* QR STATE */}
            {panelState === 'qr' && qrImage && (
                <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
                    <div className="relative p-6 bg-white rounded-[40px] shadow-[0_20px_60px_rgba(255,255,255,0.1)]">
                        <img src={qrImage} alt="WhatsApp QR Code" className="w-64 h-64 rounded-2xl" />
                        <div className="absolute -top-3 -right-3 w-10 h-10 bg-fuchsia-600 rounded-full flex items-center justify-center text-white font-bold animate-bounce">!</div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 text-amber-400">
                            <div className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse shadow-[0_0_10px_#fbbf24]" />
                            <span className="text-sm font-black">انتظار المسح من الهاتف...</span>
                        </div>
                        <p className="text-[10px] text-white/20">سيختفي الكود تلقائياً عند إتمام الربط</p>
                    </div>
                    <div className="flex gap-3 mt-2">
                        <button
                            onClick={() => handleDisconnect(true)}
                            className="px-6 py-3 bg-white/5 text-white/40 text-xs font-bold rounded-2xl hover:bg-white/10 hover:text-white transition-all flex items-center gap-2 border border-white/5"
                        >
                            <RotateCcw size={14} /> إعادة التوليد
                        </button>
                    </div>
                </div>
            )}

            {/* CONNECTED STATE */}
            {panelState === 'connected' && (
                <div className="flex flex-col items-center gap-8 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="relative">
                        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.1)]">
                            <CheckCircle size={48} className="text-green-400" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-black flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-green-400 mb-2">متصل بالخدمة</p>
                        <p className="text-sm text-white/40">واتساب الإدارة يعمل الآن ويستقبل الرسائل</p>
                    </div>
                    
                    <div className="flex flex-col gap-3 w-full max-w-[240px]">
                        <button
                            onClick={() => handleDisconnect(false)}
                            className="w-full py-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-[24px] text-sm font-black hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            <LogOut size={18} />
                            قطع الاتصال العادي
                        </button>
                        
                        <button
                            onClick={() => handleDisconnect(true)}
                            className="w-full py-3 bg-white/5 text-white/30 rounded-2xl text-[10px] font-bold hover:text-red-400 transition-all flex items-center justify-center gap-2"
                        >
                            <AlertTriangle size={12} />
                            تطهير شامل للجلسة (Force Reset)
                        </button>
                    </div>
                </div>
            )}

            {/* FOOTER */}
            <div className="flex items-center gap-2 text-white/10 text-[10px] font-medium tracking-widest mt-4">
                <Smartphone size={14} />
                <span>O2OEG CONTROL CENTER • v2.1 ULTRA</span>
            </div>
        </div>
    );
};

export default WhatsAppAdminPanel;
