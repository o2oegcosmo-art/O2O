import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPolicy: React.FC = () => {
    return (
        <div dir="rtl" className="min-h-screen bg-[#0A0A0C] text-[#e3e2e7] font-['Inter'] antialiased pt-32 pb-20 px-6 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(6,182,212,0.1)_0%,rgba(10,10,12,0)_70%)] pointer-events-none z-0"></div>
            
            <div className="max-w-4xl mx-auto relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-16 shadow-2xl"
                >
                    <div className="flex items-center gap-4 mb-12 border-b border-white/10 pb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <span className="material-symbols-outlined text-white text-3xl">shield_lock</span>
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">سياسة الخصوصية</h1>
                            <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-bold">آخر تحديث: مايو 2026</p>
                        </div>
                    </div>

                    <div className="space-y-10 text-right leading-relaxed text-white/80">
                        <section>
                            <h2 className="text-xl font-bold text-fuchsia-400 mb-4 flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-fuchsia-400 rounded-full"></span>
                                1. حماية بياناتكم هي أولويتنا
                            </h2>
                            <p>
                                في **O2OEG**، ندرك تماماً حساسية البيانات التي يتم إدخالها من قبل الصالونات والشركات. نحن ملتزمون بحماية خصوصيتك وضمان أمان بيانات عملائك وموظفيك باستخدام أحدث تقنيات التشفير.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-cyan-400 rounded-full"></span>
                                2. البيانات التي نجمعها
                            </h2>
                            <ul className="list-disc list-inside space-y-3 pr-4">
                                <li>**بيانات التسجيل:** الاسم، البريد الإلكتروني، رقم الهاتف، وموقع الصالون/الشركة.</li>
                                <li>**بيانات التشغيل:** جداول المواعيد، قائمة الخدمات، بيانات الموظفين (لأغراض تنظيمية فقط).</li>
                                <li>**بيانات الذكاء الاصطناعي:** يتم تحليل سلوك الاستخدام لتقديم استشارات مخصصة لتحسين الأداء التجاري.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-fuchsia-400 mb-4 flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-fuchsia-400 rounded-full"></span>
                                3. كيف نستخدم بياناتكم
                            </h2>
                            <p>
                                يتم استخدام البيانات لتشغيل ميزات المنصة مثل (نظام الحجز، التقارير المالية، استشارات Will AI). نحن لا نقوم ببيع بياناتك لأي طرف ثالث بأي شكل من الأشكال.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-cyan-400 rounded-full"></span>
                                4. أمان التخزين
                            </h2>
                            <p>
                                يتم تخزين كافة البيانات على خوادم سحابية محمية ومؤمنة في بيئة VPS معزولة. يتم أخذ نسخ احتياطية دورية لضمان عدم ضياع البيانات في أي ظرف تقني.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-fuchsia-400 mb-4 flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-fuchsia-400 rounded-full"></span>
                                5. حقوق المستخدم
                            </h2>
                            <ul className="list-disc list-inside space-y-3 pr-4">
                                <li>لك الحق في تعديل بيانات حسابك في أي وقت من لوحة التحكم.</li>
                                <li>لك الحق في طلب حذف حسابك بالكامل، وسيتم حذف كافة بيانات الصالون التابعة لك من خوادمنا بشكل نهائي.</li>
                            </ul>
                        </section>

                        <section className="pt-8 border-t border-white/10 text-center">
                            <p className="text-white/40 text-sm italic">
                                "ثقتكم هي وقود نجاحنا في O2OEG"
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
