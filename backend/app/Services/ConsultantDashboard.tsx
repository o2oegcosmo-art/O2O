import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Lightbulb,
    Target,
    Zap,
    MessageSquare,
    Copy,
    CheckCircle,
    RefreshCcw,
    TrendingUp
} from 'lucide-react';

interface AIAdvice {
    summary: string;
    marketing_advice: string[];
    sales_hack: string;
    suggested_whatsapp_status: string;
}

const ConsultantDashboard: React.FC = () => {
    const [advice, setAdvice] = useState<AIAdvice | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [copied, setCopied] = useState<boolean>(false);
    const [sendingTest, setSendingTest] = useState<boolean>(false);

    const fetchAdvice = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/consultant/advice');
            if (response.data.success) {
                setAdvice(response.data.advice);
            }
        } catch (error) {
            console.error("Error fetching AI advice:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdvice();
    }, []);

    const handleCopyAndSendTest = async (text: string) => {
        // 1. النسخ للحافظة
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);

        // 2. إرسال رسالة تجريبية للواتساب
        setSendingTest(true);
        try {
            await axios.post('/api/consultant/send-test', { message: text });
        } catch (error) {
            console.error("Failed to send test message:", error);
        } finally {
            setSendingTest(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-purple-400">
                <RefreshCcw className="w-12 h-12 animate-spin mb-4" />
                <p className="text-xl font-medium">جاري استشارة الذكاء الاصطناعي...</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <TrendingUp className="text-purple-500 w-8 h-8" />
                        المستشار الذكي (AI Consultant)
                    </h1>
                    <p className="text-gray-400 mt-2">تحليل استراتيجي مخصص لنمو صالونك في السوق المصري</p>
                </div>
                <button
                    onClick={fetchAdvice}
                    className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-purple-900/20"
                >
                    <RefreshCcw className="w-5 h-5" />
                    تحديث الاستشارة
                </button>
            </div>

            {/* Summary Card */}
            {advice?.summary && (
                <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 p-6 rounded-2xl">
                    <h2 className="text-lg font-semibold text-purple-300 flex items-center gap-2 mb-3">
                        <Lightbulb className="w-5 h-5" /> ملخص الوضع الحالي
                    </h2>
                    <p className="text-gray-200 leading-relaxed text-lg">{advice.summary}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Marketing Action Cards */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 px-2">
                        <Target className="text-blue-400 w-6 h-6" /> خطوات تسويقية مقترحة
                    </h2>
                    {advice?.marketing_advice.map((item, index) => (
                        <div
                            key={index}
                            className="group bg-gray-800/50 border border-gray-700 hover:border-blue-500/50 p-5 rounded-2xl transition-all cursor-default"
                        >
                            <div className="flex gap-4">
                                <div className="bg-blue-500/10 text-blue-400 p-3 rounded-xl h-fit">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-gray-200 text-lg leading-snug">{item}</p>
                                    <button className="mt-3 text-sm text-blue-400 hover:text-blue-300 font-medium">
                                        تحديد كمهمة مكتملة ←
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Hacks and Content Section */}
                <div className="space-y-6">
                    {/* Sales Hack Card */}
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2 px-2 mb-4">
                            <Zap className="text-yellow-400 w-6 h-6" /> Sales Hack
                        </h2>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 p-6 rounded-2xl relative overflow-hidden group">
                            <Zap className="absolute -right-4 -bottom-4 w-24 h-24 text-yellow-500/10 group-hover:scale-110 transition-transform" />
                            <p className="text-yellow-100 text-xl font-medium relative z-10 italic">
                                "{advice?.sales_hack}"
                            </p>
                        </div>
                    </div>

                    {/* WhatsApp Status Card */}
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2 px-2 mb-4">
                            <MessageSquare className="text-green-400 w-6 h-6" /> محتوى مقترح للواتساب
                        </h2>
                        <div className="bg-gray-800/80 border border-gray-700 p-6 rounded-2xl space-y-4">
                            <div className="bg-gray-900/50 p-4 rounded-xl text-gray-300 border border-gray-800 whitespace-pre-wrap">
                                {advice?.suggested_whatsapp_status}
                            </div>
                            <button
                                onClick={() => handleCopyAndSendTest(advice?.suggested_whatsapp_status || '')}
                                disabled={sendingTest}
                                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${copied
                                    ? 'bg-green-600 text-white'
                                    : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
                                    }`}
                            >
                                {sendingTest ? <RefreshCcw className="w-5 h-5 animate-spin" /> : (copied ? <CheckCircle className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />)}
                                {sendingTest ? 'جاري إرسال تجربة...' : (copied ? 'تم النسخ والإرسال!' : 'نسخ وإرسال تجربة لهاتفي')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConsultantDashboard;