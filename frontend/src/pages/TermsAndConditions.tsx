import React from 'react';
import { motion } from 'framer-motion';

const TermsAndConditions: React.FC = () => {
    return (
        <div dir="rtl" className="min-h-screen bg-[#0A0A0C] text-[#e3e2e7] font-['Inter'] antialiased pt-32 pb-20 px-6 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="fixed top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(192,38,211,0.1)_0%,rgba(10,10,12,0)_70%)] pointer-events-none z-0"></div>
            
            <div className="max-w-4xl mx-auto relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-16 shadow-2xl"
                >
                    <div className="flex items-center gap-4 mb-12 border-b border-white/10 pb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
                            <span className="material-symbols-outlined text-white text-3xl">gavel</span>
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">الشروط والأحكام</h1>
                            <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-bold">آخر تحديث: مايو 2026</p>
                        </div>
                    </div>

                    <div className="space-y-10 text-right leading-relaxed text-white/80">
                        <section>
                            <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-cyan-400 rounded-full"></span>
                                1. مقدمة واصطلاحات
                            </h2>
                            <p>
                                نرحب بكم في منصة **O2OEG (AI Beauty Hub)**. هذه الشروط والأحكام تمثل اتفاقية قانونية ملزمة بينكم وبين المنصة. باستخدامكم للمنصة، سواء كصاحب صالون (شريك) أو كشركة تجميل أو مسوق، فإنكم تقرون بالموافقة الكاملة على هذه الشروط.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-fuchsia-400 mb-4 flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-fuchsia-400 rounded-full"></span>
                                2. حسابات المستخدمين والمسؤولية
                            </h2>
                            <ul className="list-disc list-inside space-y-3 pr-4">
                                <li>يجب أن تكون جميع البيانات المدخلة عند التسجيل صحيحة ودقيقة ومطابقة للواقع التجاري.</li>
                                <li>أنت مسؤول مسؤولية كاملة عن الحفاظ على سرية بيانات حسابك وكلمة المرور الخاصة بك.</li>
                                <li>المنصة غير مسؤولة عن أي فقدان للبيانات ينتج عن مشاركة كلمات المرور أو استخدام كلمات مرور ضعيفة.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-cyan-400 rounded-full"></span>
                                3. خدمات الذكاء الاصطناعي (Will AI)
                            </h2>
                            <p>
                                تقدم منصة O2OEG استشارات أعمال مدعومة بالذكاء الاصطناعي. هذه الاستشارات هي أدوات مساعدة لاتخاذ القرار بناءً على البيانات المتوفرة، ولا تتحمل المنصة المسؤولية القانونية عن النتائج التجارية المترتبة على قراراتكم المبنية على هذه الاستشارات.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-fuchsia-400 mb-4 flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-fuchsia-400 rounded-full"></span>
                                4. الاشتراكات والمدفوعات
                            </h2>
                            <ul className="list-disc list-inside space-y-3 pr-4">
                                <li>توفر المنصة فترة تجريبية مجانية لمدة 7 أيام للشركاء الجدد.</li>
                                <li>يتم دفع الاشتراكات عبر الوسائل المتاحة في مصر (فودافون كاش، إنستا باي، تحويل بنكي).</li>
                                <li>بمجرد إتمام الدفع وتفعيل الخدمة، لا يحق للمستخدم المطالبة باسترداد المبالغ المدفوعة إلا في حالات استثنائية تقررها إدارة المنصة.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-red-400 rounded-full"></span>
                                5. السلوك المحظور
                            </h2>
                            <p>
                                يحظر تماماً محاولة اختراق النظام، أو استخدام المنصة في أغراض تخالف القوانين المصرية، أو محاولة استخراج بيانات المنافسين بطرق غير مشروعة. أي محاولة من هذا القبيل تؤدي لإغلاق الحساب فوراً والملاحقة القانونية.
                            </p>
                        </section>

                        <section className="pt-8 border-t border-white/10 text-center">
                            <p className="text-white/40 text-sm">
                                في حال وجود أي استفسار، يرجى التواصل مع فريق الدعم الفني عبر وسائل التواصل المتاحة.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default TermsAndConditions;
