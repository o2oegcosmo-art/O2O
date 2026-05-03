import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import heroModel from '../assets/hero_model.png';
import salonInterior from '../assets/salon_interior.png';
import beautyProducts from '../assets/beauty_products.png';

interface LandingPageProps {
    openForm?: (type: 'salon' | 'company' | 'affiliate') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ openForm }) => {
    return (
        <div dir="rtl" className="font-['Inter'] bg-[#0A0A0C] text-[#e3e2e7] antialiased relative overflow-hidden" style={{ minHeight: '100vh' }}>

            {/* Background Orbs */}
            <div className="fixed top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(192,38,211,0.15)_0%,rgba(10,10,12,0)_70%)] pointer-events-none z-0"></div>
            <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(6,182,212,0.1)_0%,rgba(10,10,12,0)_70%)] pointer-events-none z-0"></div>



            <main className="relative z-10 pt-20">
                {/* Live Status Bar */}
                <div className="max-w-7xl mx-auto px-8 mb-4">
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex flex-wrap items-center gap-6 py-2 px-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">120+ Salons Live</span>
                        </div>
                        <div className="w-px h-3 bg-white/10 hidden sm:block"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
                            <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">45 Companies Integrated</span>
                        </div>
                        <div className="w-px h-3 bg-white/10 hidden sm:block"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse"></div>
                            <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Will AI Hub: Online</span>
                        </div>
                    </motion.div>
                </div>

                {/* Hero */}
                <section className="pt-20 pb-20 px-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 min-h-[90vh]">
                    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="lg:w-1/2 space-y-6">
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-fuchsia-500/40 bg-gradient-to-r from-fuchsia-500/10 to-cyan-500/10 backdrop-blur-sm">
                            <span className="text-xl font-black text-white tracking-tighter font-['Space_Grotesk']">O2O EG</span>
                            <span className="w-px h-4 bg-white/20"></span>
                            <span className="text-[11px] font-bold tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 uppercase">AI BEAUTY HUB</span>
                        </div>
                        <h1 className="font-['Space_Grotesk'] text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.3] tracking-tight py-2">
                            المنصة المتكاملة <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">لإدارة صالونات التجميل واستشارات الأعمال</span> بالذكاء الاصطناعي
                        </h1>
                        <p className="font-['Inter'] text-lg text-[#c8c5ca] max-w-xl leading-relaxed">
                            حجز مواعيد سلس، إدارة ذكية للصالونات، واستشارات احترافية للشركات والمسوقين — كل ذلك مدعوم بالذكاء الاصطناعي.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-2">
                            <button onClick={() => openForm && openForm('salon')} className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(192,38,211,0.3)] flex items-center gap-2 text-sm">
                                سجّل اهتمامك الآن
                                <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                            </button>
                            <Link to="/articles" className="border border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-400 font-semibold px-8 py-4 rounded-xl transition-all text-sm text-center inline-block">
                                اكتشف الحلول
                            </Link>
                        </div>

                    </motion.div>

                    {/* Floating Cards */}
                    <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="lg:w-1/2 relative h-[580px] w-full">
                        {/* Card 1 - Model */}
                        <div className="absolute top-0 left-0 w-64 h-80 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform duration-500 z-30">
                            <img className="w-full h-48 object-cover object-top" alt="موديل صبغة شعر" src={heroModel} />
                            <div className="p-4 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-white">جلسة صبغة نيون</span>
                                    <span className="text-[10px] text-fuchsia-400 font-bold">مباشر</span>
                                </div>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-fuchsia-500 w-3/4"></div>
                                </div>
                                <div className="text-[10px] text-cyan-400 font-bold mt-1">✓ تم تأكيد الحجز</div>
                            </div>
                        </div>

                        {/* Card 2 - Calendar */}
                        <div className="absolute bottom-10 right-0 w-72 bg-white/5 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500 z-20">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-['Space_Grotesk'] text-[12px] font-bold tracking-widest text-white">جدول اليوم</h4>
                                <span className="material-symbols-outlined text-cyan-400">calendar_today</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/10">
                                    <div className="w-2 h-10 bg-cyan-400 rounded-full flex-shrink-0"></div>
                                    <div>
                                        <p className="text-xs font-bold text-white">بالاياج كامل</p>
                                        <p className="text-[10px] text-white/50">14:00 - 16:30</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/10">
                                    <div className="w-2 h-10 bg-fuchsia-400 rounded-full flex-shrink-0"></div>
                                    <div>
                                        <p className="text-xs font-bold text-white">تحليل لون بالذكاء الاصطناعي</p>
                                        <p className="text-[10px] text-white/50">17:00 - 17:45</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/10 text-center">
                                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">محجوز بالكامل اليوم</span>
                            </div>
                        </div>

                        {/* Card 3 - Analytics */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 bg-white/5 backdrop-blur-xl border border-fuchsia-500/20 rounded-2xl p-6 shadow-2xl z-10">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-bold text-white/70">تحليل العائد</h4>
                                <span className="text-xs text-green-400 font-bold">+24%</span>
                            </div>
                            <div className="flex items-end gap-1 h-24">
                                <div className="flex-1 bg-white/10 h-[30%] rounded-t-sm"></div>
                                <div className="flex-1 bg-white/10 h-[45%] rounded-t-sm"></div>
                                <div className="flex-1 bg-fuchsia-500 h-[85%] rounded-t-sm shadow-[0_0_20px_rgba(192,38,211,0.3)]"></div>
                                <div className="flex-1 bg-white/10 h-[60%] rounded-t-sm"></div>
                                <div className="flex-1 bg-cyan-500 h-[95%] rounded-t-sm shadow-[0_0_20px_rgba(6,182,212,0.3)]"></div>
                            </div>
                            <p className="text-[10px] text-white/40 mt-4 text-center font-bold">بيانات الاستبقاء والاكتساب</p>
                        </div>
                    </motion.div>
                </section>

                {/* Services Bento */}
                <section className="py-20 px-8 max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="font-['Space_Grotesk'] text-4xl font-bold text-white mb-4">منظومة <span className="text-cyan-400">الخدمات</span></h2>
                        <p className="text-[#c8c5ca] max-w-2xl mx-auto">أدوات متكاملة صُممت لجيل رواد التجميل الجدد في 2026.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Card 1 */}
                        <div className="md:col-span-7 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 group hover:border-fuchsia-500/50 transition-all">
                            <div className="flex flex-col md:flex-row gap-6 h-full">
                                <div className="md:w-1/2 space-y-3">
                                    <span className="material-symbols-outlined text-fuchsia-400 text-4xl">calendar_month</span>
                                    <h3 className="font-['Space_Grotesk'] text-2xl font-medium text-white">الحجز الذكي للمواعيد</h3>
                                    <p className="text-[#c8c5ca]">نظام حجز مدعوم بالذكاء الاصطناعي يمنع تضارب المواعيد وينظم جداول الموظفين بدقة تامة.</p>
                                </div>
                                <div className="md:w-1/2 rounded-2xl overflow-hidden border border-white/5 bg-black/50 flex items-center justify-center">
                                    <img className="w-full h-full object-cover rounded-xl opacity-60 group-hover:opacity-100 transition-opacity" alt="صالون تجميل" src={salonInterior} />
                                </div>
                            </div>
                        </div>
                        {/* Card 2 */}
                        <div className="md:col-span-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 group hover:border-cyan-500/50 transition-all flex flex-col justify-between">
                            <div className="space-y-3">
                                <span className="material-symbols-outlined text-cyan-400 text-4xl">settings_account_box</span>
                                <h3 className="font-['Space_Grotesk'] text-2xl font-medium text-white">نظام إدارة الصالون</h3>
                                <p className="text-[#c8c5ca]">إدارة المخزون والموظفين والمشتريات في لوحة تحكم واحدة متكاملة.</p>
                            </div>
                            <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
                                <div className="flex -space-x-2 space-x-reverse">
                                    <div className="w-8 h-8 rounded-full border border-black bg-gray-500"></div>
                                    <div className="w-8 h-8 rounded-full border border-black bg-fuchsia-500"></div>
                                    <div className="w-8 h-8 rounded-full border border-black bg-cyan-500"></div>
                                </div>
                                <span className="text-xs text-white/40 font-bold">12 موظف متصل</span>
                            </div>
                        </div>
                        {/* Card 3 */}
                        <div className="md:col-span-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 group hover:border-cyan-500/50 transition-all">
                            <div className="space-y-3 mb-6">
                                <span className="material-symbols-outlined text-cyan-400 text-4xl">trending_up</span>
                                <h3 className="font-['Space_Grotesk'] text-2xl font-medium text-white">استشارات ونمو العلامات التجارية</h3>
                                <p className="text-[#c8c5ca]">استشارات استراتيجية للشركات والمسوقين لتوسيع أعمالهم في قطاع التجميل.</p>
                            </div>
                            <div className="h-32 bg-gradient-to-t from-cyan-500/20 to-transparent rounded-xl border border-cyan-500/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-cyan-400 text-4xl">insights</span>
                            </div>
                        </div>
                        {/* Card 4 */}
                        <div className="md:col-span-7 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 group hover:border-fuchsia-500/50 transition-all flex flex-col md:flex-row gap-6">
                            <div className="md:w-1/2 rounded-2xl overflow-hidden border border-white/5 bg-black/50 h-48 md:h-full">
                                <img className="w-full h-full object-cover rounded-xl opacity-60 group-hover:opacity-100 transition-opacity" alt="منتجات تجميل" src={beautyProducts} />
                            </div>
                            <div className="md:w-1/2 space-y-3">
                                <span className="material-symbols-outlined text-fuchsia-400 text-4xl">campaign</span>
                                <h3 className="font-['Space_Grotesk'] text-2xl font-medium text-white">حلول التسويق بالذكاء الاصطناعي</h3>
                                <p className="text-[#c8c5ca]">حملات تسويقية ذاتية تعمل بالذكاء الاصطناعي لاستهداف عملائك المحليين بدقة.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Journey */}
                <section className="py-20 bg-black/30 relative">
                    <div className="max-w-7xl mx-auto px-8">
                        <div className="text-center mb-16">
                            <h2 className="font-['Space_Grotesk'] text-4xl font-bold text-white">رحلة <span className="text-fuchsia-500">العميل</span></h2>
                            <p className="text-[#c8c5ca] mt-2">من الاكتشاف الرقمي إلى التجربة الفعلية في الصالون.</p>
                        </div>
                        <div className="relative flex flex-col md:flex-row justify-between items-center md:items-start gap-12 md:gap-4">
                            <div className="hidden md:block absolute top-12 left-0 w-full h-[2px] bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-fuchsia-500 opacity-20"></div>
                            {[
                                { icon: 'explore', color: 'fuchsia', title: 'الاكتشاف', desc: 'الذكاء الاصطناعي يربط العملاء بالصالون المناسب لهم.' },
                                { icon: 'bolt', color: 'cyan', title: 'حجز سلس', desc: 'حجز في 3 خطوات عبر واتساب أو التطبيق أو الموقع.' },
                                { icon: 'content_cut', color: 'fuchsia', title: 'الخدمة الفعلية', desc: 'تجربة تجميل استثنائية في الصالون بدقة بيانات ذكية.' },
                            ].map((step, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center text-center relative z-10 group w-full">
                                    <div className={`w-24 h-24 rounded-full bg-white/5 backdrop-blur-xl border border-${step.color}-500/50 flex items-center justify-center mb-6 mx-auto group-hover:shadow-[0_0_20px_rgba(192,38,211,0.3)] transition-all duration-500`}>
                                        <span className={`material-symbols-outlined text-${step.color}-400 text-4xl`}>{step.icon}</span>
                                    </div>
                                    <h4 className="font-['Space_Grotesk'] text-xl font-semibold text-white mb-2 text-center">{step.title}</h4>
                                    <p className="text-[#c8c5ca] text-sm max-w-[200px] mx-auto text-center">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials — SEO: آراء عملاء برنامج إدارة الصالونات في مصر */}
                <section className="py-20 px-8 max-w-7xl mx-auto" aria-label="آراء عملاء O2O EG - برنامج حجز مواعيد الصالونات في مصر">
                    <h2 className="font-['Space_Grotesk'] text-4xl font-bold text-white text-center mb-4">آراء <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">عملائنا</span></h2>
                    <p className="text-center text-[#c8c5ca] mb-16 max-w-2xl mx-auto">صالونات ومراكز تجميل وشركات من مختلف أنحاء مصر اختارت O2O EG لإدارة أعمالها وتنمية عملائها</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                        {/* محمد اسماعيل - 4 سيزون بيوتي صالون */}
                        <div className="bg-white/5 backdrop-blur-xl border border-fuchsia-500/20 rounded-3xl p-6 relative mt-6 hover:border-fuchsia-500/50 transition-all">
                            <div className="absolute -top-6 -left-2 w-12 h-12 bg-fuchsia-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(192,38,211,0.5)]">
                                <span className="material-symbols-outlined text-white">format_quote</span>
                            </div>
                            <p className="text-white italic mb-6 mt-2 leading-relaxed text-sm">
                                "من أول ما اشتغلنا مع O2O EG، الصالون اتنظم بشكل مش طبيعي. نظام الحجز الأونلاين وفّر علينا وقت ومجهود كتير، والعملاء بقوا بيرجعوا أكتر. أنصح أي صالون تجميل في مصر يجرّبه."
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-700 border border-white/20 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">م</div>
                                <div>
                                    <p className="text-white font-bold text-sm">محمد اسماعيل</p>
                                    <p className="text-fuchsia-400 text-[10px] font-bold tracking-wide">FOR SEASON BEAUTY SALON</p>
                                    <p className="text-white/40 text-[9px] mt-0.5">الاسماعيلية، مصر</p>
                                </div>
                            </div>
                        </div>

                        {/* هاني سنس - صالون سنس المهندسين */}
                        <div className="bg-white/5 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-6 relative mt-6 hover:border-cyan-500/50 transition-all">
                            <div className="absolute -top-6 -left-2 w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                                <span className="material-symbols-outlined text-white">format_quote</span>
                            </div>
                            <p className="text-white italic mb-6 mt-2 leading-relaxed text-sm">
                                "برنامج إدارة الصالونات ده غيّر طريقة شغلنا خالص. دلوقتي بقدر أتابع الموظفين والمواعيد والأرباح من موبايلي في أي وقت. الـ AI بيساعدني أعرف العميل محتاج إيه قبل ما يتكلم."
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 border border-white/20 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">ه</div>
                                <div>
                                    <p className="text-white font-bold text-sm">هاني سنس</p>
                                    <p className="text-cyan-400 text-[10px] font-bold tracking-wide">SENSE SALON - MOHANDESSIN</p>
                                    <p className="text-white/40 text-[9px] mt-0.5">المهندسين، القاهرة</p>
                                </div>
                            </div>
                        </div>

                        {/* هاني فاروق - CEO بروفيشنال لاند */}
                        <div className="bg-white/5 backdrop-blur-xl border border-fuchsia-500/20 rounded-3xl p-6 relative mt-6 hover:border-fuchsia-500/50 transition-all">
                            <div className="absolute -top-6 -left-2 w-12 h-12 bg-fuchsia-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(192,38,211,0.5)]">
                                <span className="material-symbols-outlined text-white">format_quote</span>
                            </div>
                            <p className="text-white italic mb-6 mt-2 leading-relaxed text-sm">
                                "كـ CEO في بروفيشنال لاند، كنا محتاجين حل يجمع بين الاستشارات التسويقية وإدارة العملاء. O2O EG كان الحل المثالي للشركات اللي شغالة في قطاع التجميل. الـ Will AI بيقدم توصيات استراتيجية تنافسية جداً."
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-700 border border-white/20 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">ه</div>
                                <div>
                                    <p className="text-white font-bold text-sm">هاني فاروق</p>
                                    <p className="text-fuchsia-400 text-[10px] font-bold tracking-wide">CEO - PROFESSIONAL LAND</p>
                                    <p className="text-white/40 text-[9px] mt-0.5">القاهرة، مصر</p>
                                </div>
                            </div>
                        </div>

                        {/* سارة جمال - مدير تسويق */}
                        <div className="bg-white/5 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-6 relative mt-6 hover:border-cyan-500/50 transition-all">
                            <div className="absolute -top-6 -left-2 w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                                <span className="material-symbols-outlined text-white">format_quote</span>
                            </div>
                            <p className="text-white italic mb-6 mt-2 leading-relaxed text-sm">
                                "كمسوّقة بتشتغل مع صالونات تجميل، O2O EG بيديني data حقيقية عن سلوك العملاء وأداء الحملات. الـ ROI tracking مش موجودة في أي نظام تاني في السوق المصري."
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-700 border border-white/20 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">س</div>
                                <div>
                                    <p className="text-white font-bold text-sm">سارة جمال</p>
                                    <p className="text-cyan-400 text-[10px] font-bold tracking-wide">DIGITAL MARKETING DIRECTOR</p>
                                    <p className="text-white/40 text-[9px] mt-0.5">القاهرة، مصر</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>


                {/* CTA */}
                <section className="py-20 px-8 max-w-5xl mx-auto mb-10">
                    <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-12 border-2 border-fuchsia-500/30 relative overflow-hidden text-center">
                        <div className="absolute top-0 right-1/4 w-32 h-1 bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.8)]"></div>
                        <div className="absolute bottom-0 left-1/4 w-32 h-1 bg-fuchsia-500 shadow-[0_0_20px_rgba(192,38,211,0.8)]"></div>
                        <h2 className="font-['Space_Grotesk'] text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                            هل أنت مستعد لتحويل <br /><span className="text-cyan-400">أعمالك في التجميل؟</span>
                        </h2>
                        <p className="text-[#c8c5ca] text-lg max-w-xl mx-auto mb-10">
                            انضم إلى شبكة الصالونات الرائدة التي تتوسع بذكاء اصطناعي. احصل على وصول حصري لنسخة البيتا.
                        </p>
                        <form className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto" onSubmit={(e) => { e.preventDefault(); openForm && openForm('salon'); }}>
                            <input className="flex-1 bg-white/5 border-b border-white/20 focus:border-cyan-400 focus:outline-none text-white placeholder-white/30 rounded-lg py-4 px-6 transition-all text-right" placeholder="أدخل بريدك الإلكتروني التجاري" type="email" />
                            <button type="submit" className="bg-gradient-to-r from-fuchsia-600 to-cyan-500 text-white font-semibold px-8 py-4 rounded-lg hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(192,38,211,0.3)] whitespace-nowrap">
                                سجّل اهتمامك
                            </button>
                        </form>
                        <p className="text-[10px] text-white mt-6 font-bold tracking-widest uppercase">عدد محدود للانضمام في 2026</p>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-[#0A0A0C] w-full border-t border-fuchsia-500/30 pt-12 pb-8 shadow-[0_-10px_40px_rgba(192,38,211,0.05)] relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-center px-12 max-w-7xl mx-auto gap-8">
                    <div className="flex flex-col gap-2 items-center md:items-end">
                        <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-400 font-['Space_Grotesk']">O2O EG</span>
                        <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">الدقة في كل إطلالة</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-8">
                        {['سياسة الخصوصية', 'الشروط والأحكام', 'التوثيق', 'تواصل معنا'].map((l, i) => (
                            <a key={i} className="text-white/40 hover:text-cyan-400 transition-colors font-bold text-xs tracking-wide" href="#">{l}</a>
                        ))}
                    </div>
                    <p className="text-white/40 text-xs font-['Space_Grotesk'] tracking-[0.2em] text-center">© 2026 O2O EG: AI BEAUTY HUB</p>
                </div>
                <div className="max-w-7xl mx-auto px-12 mt-10 flex justify-center gap-6 opacity-30">
                    {['language', 'account_circle', 'verified', 'hub'].map((icon, i) => (
                        <span key={i} className="material-symbols-outlined text-white">{icon}</span>
                    ))}
                </div>
            </footer>

        </div>
    );
};

export default LandingPage;
