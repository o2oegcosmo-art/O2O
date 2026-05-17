import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Book, Zap, Shield, MessageSquare, PlayCircle, ChevronLeft, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const categories = [
  {
    id: 'get-started',
    title: 'البداية السريعة',
    icon: <Zap className="text-amber-400" />,
    articles: [
      'كيفية إنشاء حساب صالون جديد',
      'تخصيص الملف الشخصي لصالونك',
      'إضافة الخدمات والأسعار وصور العمل',
      'إعداد مواعيد العمل والموظفين'
    ]
  },
  {
    id: 'ai-consultant',
    title: 'مستشار الذكاء الاصطناعي (Will AI)',
    icon: <HelpCircle className="text-fuchsia-400" />,
    articles: [
      'ما هو Will AI وكيف يساعد صالونك؟',
      'كيفية قراءة تحليلات الأداء الذكية',
      'تحسين تجربة العميل باستخدام الـ AI',
      'تخصيص ردود المستشار الآلي'
    ]
  },
  {
    id: 'bookings',
    title: 'إدارة الحجوزات',
    icon: <Book className="text-cyan-400" />,
    articles: [
      'متابعة جدول المواعيد اليومي',
      'تأكيد وإلغاء الحجوزات',
      'ربط واتساب لتفعيل الحجز الآلي',
      'إدارة قائمة العملاء (CRM)'
    ]
  },
  {
    id: 'security',
    title: 'الأمان والخصوصية',
    icon: <Shield className="text-green-400" />,
    articles: [
      'كيف نحمي بيانات عملائك؟',
      'إعدادات الأمان وتغيير كلمة المرور',
      'إدارة صلاحيات الموظفين',
      'النسخ الاحتياطي للبيانات'
    ]
  }
];

const HelpCenter: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div dir="rtl" className="min-h-screen bg-[#0A0A0C] text-white font-['Inter'] relative overflow-hidden pt-32 pb-20 px-6">
      {/* Background Decor */}
      <div className="fixed top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(192,38,211,0.08)_0%,rgba(10,10,12,0)_70%)] pointer-events-none"></div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="text-center space-y-6 mb-16">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-bold tracking-widest uppercase"
          >
            <MessageSquare size={14} className="text-cyan-400" />
            مركز مساعدة O2OEG
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black"
          >
            كيف يمكننا <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">مساعدتك اليوم؟</span>
          </motion.h1>
          
          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto relative mt-8"
          >
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20" size={20} />
            <input 
              type="text" 
              placeholder="ابحث عن موضوع، ميزة، أو سؤال..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pr-14 pl-6 text-lg outline-none focus:border-fuchsia-500 transition-all shadow-2xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </motion.div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
          {categories.map((cat, idx) => (
            <motion.div 
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:border-fuchsia-500/30 transition-all group"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                  {cat.icon}
                </div>
                <h2 className="text-xl font-bold">{cat.title}</h2>
              </div>
              <ul className="space-y-4">
                {cat.articles.map((art, i) => (
                  <li key={i}>
                    <a href="#" className="flex items-center justify-between text-white/50 hover:text-cyan-400 transition-colors text-sm font-medium group/item">
                      {art}
                      <ChevronLeft size={16} className="opacity-0 group-hover/item:opacity-100 transition-all -translate-x-2 group-hover/item:translate-x-0" />
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Quick Links Section */}
        <div className="bg-gradient-to-r from-fuchsia-600/10 to-cyan-500/10 rounded-[2.5rem] p-10 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <PlayCircle size={32} className="text-fuchsia-400" />
                </div>
                <div>
                    <h3 className="text-xl font-bold">دروس فيديو تعليمية</h3>
                    <p className="text-white/40 text-sm">شاهد فيديوهات قصيرة تشرح لك كيفية استخدام كل ميزة في المنصة.</p>
                </div>
            </div>
            <button className="bg-white text-black font-bold px-8 py-3 rounded-xl hover:scale-105 transition-all whitespace-nowrap">
                شاهد الآن
            </button>
        </div>

        {/* Support CTA */}
        <div className="mt-20 text-center">
            <p className="text-white/40 mb-4">لم تجد ما تبحث عنه؟</p>
            <div className="flex flex-wrap justify-center gap-4">
                <a href="https://wa.me/201044167626" target="_blank" className="bg-green-500/10 border border-green-500/20 text-green-400 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-green-500/20 transition-all">
                    تواصل معنا عبر واتساب
                </a>
                <Link to="/" className="bg-white/5 border border-white/10 text-white/60 px-6 py-3 rounded-xl font-bold hover:bg-white/10 transition-all">
                    العودة للرئيسية
                </Link>
            </div>
        </div>

      </div>
    </div>
  );
};

export default HelpCenter;
