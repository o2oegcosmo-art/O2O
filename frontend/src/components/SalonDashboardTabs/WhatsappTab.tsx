import React from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface WhatsappTabProps {
    data: any;
    isBridgeConnected: boolean;
    setIsBridgeConnected: (val: boolean) => void;
    isResetting: boolean;
    setIsResetting: (val: boolean) => void;
    setManualMode: (val: boolean) => void;
    qrCode: string | null;
    setQrCode: (val: string | null) => void;
    fetchQR: () => void;
    generateNewQR: () => void;
    pairingMode: boolean;
    setPairingMode: (val: boolean) => void;
    pairingPhone: string;
    setPairingPhone: (val: string) => void;
    pairingCode: string | null;
    setPairingCode: (val: string | null) => void;
    loadingPairingCode: boolean;
    setLoadingPairingCode: (val: boolean) => void;
}

const WhatsappTab: React.FC<WhatsappTabProps> = ({
    data,
    isBridgeConnected,
    setIsBridgeConnected,
    isResetting,
    setIsResetting,
    setManualMode,
    qrCode,
    setQrCode,
    fetchQR,
    generateNewQR,
    pairingMode,
    setPairingMode,
    pairingPhone,
    setPairingPhone,
    pairingCode,
    setPairingCode,
    loadingPairingCode,
    setLoadingPairingCode
}) => {
    return (
        <div className="p-8">
            <h2 className="text-3xl font-black text-white mb-2">ربط مساعد الواتساب</h2>
            <p className="text-slate-400 mb-8">قم بربط رقم الواتساب الخاص بالصالون ليقوم المساعد بالرد التلقائي والحجز للعملاء.</p>
            
            <div className="bg-slate-900 border border-slate-800 p-12 rounded-[3rem] flex flex-col items-center max-w-2xl mx-auto shadow-2xl relative overflow-hidden text-center">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-3xl"></div>
                
                <div className="w-full">
                    {isBridgeConnected ? (
                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4 border border-green-500/30">
                                <span className="material-symbols-outlined text-4xl text-green-400">check_circle</span>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">المساعد متصل الآن</h3>
                            <p className="text-slate-400 text-sm max-w-xs mx-auto mb-8 leading-relaxed">
                                رقم الواتساب الخاص بك مرتبط بنجاح وسيقوم المساعد بالرد على كافة رسائل العملاء فوراً.
                            </p>
                            
                            <button 
                                onClick={async () => { 
                                    try {
                                        setIsResetting(true);
                                        setManualMode(true);
                                        localStorage.setItem('whatsapp_manual_mode', 'true');
                                        await axios.post(`/bridge/logout/${data?.tenant?.id}`).catch(() => {});
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
                                className="text-red-400 text-xs font-bold border border-red-400/20 px-6 py-2 rounded-xl hover:bg-red-400/5 transition-all"
                            >
                                قطع الاتصال بالرقم الحالي
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center w-full">
                            {/* --- Mode Toggle (Premium Design) --- */}
                            <div className="flex flex-wrap items-center justify-center gap-3 mb-8 bg-slate-800/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 shadow-inner">
                                <button 
                                    onClick={() => { setPairingMode(false); setPairingCode(null); }} 
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all duration-300 ${!pairingMode ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 scale-105' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <span className="material-symbols-outlined text-lg">qr_code_2</span>
                                    مسح QR Code
                                </button>
                                <button 
                                    onClick={() => { setPairingMode(true); setPairingCode(null); }} 
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all duration-300 ${pairingMode ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 scale-105' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <span className="material-symbols-outlined text-lg">smartphone</span>
                                    ربط برقم الهاتف
                                </button>
                            </div>

                            {pairingMode ? (
                                /* ---- Phone Pairing Mode ---- */
                                <div className="flex flex-col items-center w-full max-w-sm gap-4">
                                    {pairingCode ? (
                                        <div className="flex flex-col items-center gap-4 w-full">
                                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                                                <span className="material-symbols-outlined text-3xl text-green-400">key</span>
                                            </div>
                                            <p className="text-slate-400 text-sm">كود الربط الخاص بك:</p>
                                            <div className="bg-slate-800 border-2 border-green-500/40 rounded-2xl px-4 py-4 w-full text-center overflow-hidden">
                                                <p className="text-2xl md:text-4xl font-black text-green-400 tracking-[0.1em] md:tracking-[0.3em] break-all">{pairingCode}</p>
                                            </div>
                                            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-right space-y-4 w-full">
                                                <p className="text-white font-black text-sm flex items-center gap-2 justify-start flex-row-reverse">
                                                    <span className="material-symbols-outlined text-green-400">info</span>
                                                    خطوات الربط من هاتفك (هام جداً):
                                                </p>
                                                <div className="space-y-3">
                                                    <div className="flex items-start gap-3 flex-row-reverse">
                                                        <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex-shrink-0 flex items-center justify-center text-xs font-bold">١</div>
                                                        <p className="text-slate-300 text-xs leading-relaxed">افتح واتساب ← اضغط على <strong className="text-white">النقاط الثلاث</strong> (أو الإعدادات) ← اختر <strong className="text-white">الأجهزة المرتبطة</strong>.</p>
                                                    </div>
                                                    <div className="flex items-start gap-3 flex-row-reverse">
                                                        <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex-shrink-0 flex items-center justify-center text-xs font-bold">٢</div>
                                                        <p className="text-slate-300 text-xs leading-relaxed">اضغط على زر <strong className="text-white">"ربط جهاز"</strong> الأخضر الكبير.</p>
                                                    </div>
                                                    <div className="flex items-start gap-3 flex-row-reverse">
                                                        <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex-shrink-0 flex items-center justify-center text-xs font-bold">٣</div>
                                                        <p className="text-slate-300 text-xs leading-relaxed">ستفتح الكاميرا؛ انظر <strong className="text-cyan-400 underline">أسفل الشاشة تماماً</strong> واضغط على جملة <strong className="text-white">"الربط برقم الهاتف بدلاً من ذلك"</strong>.</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                                    <p className="text-[10px] text-red-400 font-bold">⚠️ تنبيه: إذا كان عنوان الشاشة في واتساب هو "رمز QR للرابط القصير"، فأنت في المكان الخاطئ! يرجى اتباع الخطوات أعلاه بدقة.</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-4 mt-2">
                                                <button 
                                                    onClick={async () => { 
                                                        try {
                                                            setLoadingPairingCode(true);
                                                            await axios.post(`/bridge/logout/${data?.tenant?.id}`).catch(() => {});
                                                            setPairingCode(null); 
                                                            setPairingPhone(''); 
                                                            toast.success('تم مسح الجلسة القديمة، يمكنك طلب كود جديد الآن');
                                                        } finally {
                                                            setLoadingPairingCode(false);
                                                        }
                                                    }} 
                                                    className="text-red-400 text-[10px] font-bold border border-red-500/20 px-4 py-2 rounded-lg hover:bg-red-500/5 transition-all"
                                                >
                                                    إعادة ضبط الاتصال (Reset)
                                                </button>
                                                <button onClick={() => { setPairingCode(null); setPairingPhone(''); }} className="text-slate-500 text-[10px] hover:text-slate-300 transition-colors py-2">رجوع</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center w-full gap-4">
                                            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
                                                <span className="material-symbols-outlined text-3xl text-blue-400">smartphone</span>
                                            </div>
                                            <p className="text-slate-400 text-sm text-center">أدخل رقم هاتفك مع كود الدولة</p>
                                            <input type="tel" placeholder="مثال: 201044167626" value={pairingPhone} onChange={(e) => setPairingPhone(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm text-center focus:outline-none focus:border-green-500 transition-colors" dir="ltr" />
                                            <button
                                                disabled={loadingPairingCode || !pairingPhone}
                                                onClick={async () => {
                                                    if (!pairingPhone || !data?.tenant?.id) return;
                                                    setLoadingPairingCode(true);
                                                    try {
                                                        // 🛡️ Auto-add country code for Egypt if missing
                                                        let formattedPhone = pairingPhone.replace(/\D/g, '');
                                                        if (formattedPhone.length === 11 && formattedPhone.startsWith('01')) {
                                                            formattedPhone = '20' + formattedPhone.substring(1);
                                                        } else if (formattedPhone.length === 10 && formattedPhone.startsWith('1')) {
                                                            formattedPhone = '20' + formattedPhone;
                                                        }
                                                        
                                                        const res = await axios.get(`/bridge/pairing-code/${data.tenant.id}?phone=${formattedPhone}`);
                                                        if (res.data.isConnected) { setIsBridgeConnected(true); toast.success('الواتساب متصل بالفعل!'); }
                                                        else if (res.data.code) { setPairingCode(res.data.code); }
                                                    } catch { toast.error('فشل في توليد الكود. تأكد من الرقم وحاول مرة أخرى.'); }
                                                    finally { setLoadingPairingCode(false); }
                                                }}
                                                className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {loadingPairingCode
                                                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> جاري التوليد...</>
                                                    : <><span className="material-symbols-outlined text-sm">key</span> احصل على كود الربط</>
                                                }
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* ---- QR Code Mode ---- */
                                <div className="flex flex-col items-center">
                                    <div className="bg-white p-6 rounded-[2rem] shadow-2xl mb-8">
                                        {qrCode && typeof qrCode === 'string' && qrCode.length > 0 ? (
                                            <div className="bg-white p-4 rounded-3xl shadow-inner flex items-center justify-center">
                                                <img src={qrCode.startsWith('data:') ? qrCode : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCode)}`} alt="WhatsApp QR Code" className="w-[250px] h-[250px] transition-opacity duration-500" onLoad={(e) => (e.currentTarget.style.opacity = '1')} style={{ opacity: 0 }} />
                                            </div>
                                        ) : (
                                            <div className="w-[250px] h-[250px] flex flex-col items-center justify-center bg-slate-50 rounded-xl">
                                                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                                                <p className="text-slate-400 text-[10px] font-bold px-8 text-center">{isResetting ? 'جاري مسح الجلسة...' : 'جاري جلب كود الربط من السيرفر...'}</p>
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={generateNewQR} disabled={isResetting} className="mb-8 flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-green-600/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                                        <span className="material-symbols-outlined">sync</span>
                                        توليد رمز QR جديد الآن
                                    </button>
                                    <div className="flex items-center gap-2 text-indigo-400 mb-2">
                                        <span className="material-symbols-outlined text-sm">info</span>
                                        <p className="text-sm font-bold">طريقة الربط:</p>
                                    </div>
                                    <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">افتح واتساب على هاتفك &gt; الإعدادات &gt; الأجهزة المرتبطة &gt; ربط جهاز، ثم وجه الكاميرا نحو الكود أعلاه.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WhatsappTab;
