import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Calendar, User } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/config';

interface Article {
  id: string;
  slug: string;
  title: string;
  content: string;
  category: string;
  image: string;
  author: string;
  created_at: string;
}

const SingleArticle: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/articles/${slug}`);
        setArticle(response.data.data);
      } catch (err) {
        console.error("Error fetching article", err);
        setError("عذراً، لم نتمكن من العثور على المقال المطلوب.");
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#c026d3', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0C', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: '1rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }}>{error || "المقال غير موجود"}</h2>
        <Link to="/articles" style={{ color: '#06b6d4', textDecoration: 'underline' }}>العودة إلى المقالات</Link>
      </div>
    );
  }

  return (
    <div dir="rtl" className="font-['Inter'] selection:bg-fuchsia-500/30" style={{ minHeight: '100vh', background: '#0A0A0C', color: '#e6e0e9', overflowX: 'hidden' }}>
      
      {/* Radial Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px]" style={{ background: 'radial-gradient(circle, rgba(192, 38, 211, 0.1) 0%, transparent 70%)' }}></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px]" style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)' }}></div>
      </div>

      <main className="pt-32 pb-[120px] px-6 max-w-[1000px] mx-auto relative z-10">
        
        {/* Back to Articles */}
        <Link to="/articles" className="inline-flex items-center gap-2 text-cyan-400 hover:text-fuchsia-400 transition-colors mb-12 group">
          <ArrowRight size={20} className="transform group-hover:translate-x-1 transition-transform" />
          <span className="font-['Space_Grotesk'] font-bold text-[12px] tracking-[0.1em] uppercase">العودة إلى المقالات</span>
        </Link>

        {/* Article Header */}
        <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-16">
          <div className="flex flex-wrap gap-3 mb-8">
            <span className="px-4 py-1.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 font-['Space_Grotesk'] font-bold text-[12px] tracking-[0.1em] shadow-[0_0_15px_rgba(192,38,211,0.2)]">
              {article.category}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-['Space_Grotesk'] font-bold text-white mb-10 leading-[1.2] tracking-tight">
            {article.title}
          </h1>
          <div className="flex items-center gap-8 text-[#cbc4d2] font-['Inter']">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-cyan-400" />
              <span>{new Date(article.created_at).toLocaleDateString('ar-EG', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <User size={18} className="text-fuchsia-400" />
              <span>{article.author}</span>
            </div>
          </div>
        </motion.header>

        {/* Featured Image */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative w-full aspect-video rounded-3xl overflow-hidden mb-[80px] shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/5">
          <img src={article.image || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1200'} alt={article.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-transparent to-transparent opacity-80"></div>
        </motion.div>

        {/* Body Content */}
        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="max-w-[800px] mx-auto">
          <div className="text-[18px] font-['Inter'] text-[#c8c5ca] mb-12 leading-[2.2] whitespace-pre-wrap">
            {article.content}
          </div>
        </motion.article>

        {/* Footer CTA */}
        <section className="mt-[120px]">
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 md:p-12 text-center relative overflow-hidden group">
            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500/5 to-cyan-400/5 opacity-50"></div>
            
            <h3 className="text-3xl md:text-4xl font-['Space_Grotesk'] font-bold text-white mb-6 relative z-10 leading-[1.3]">
              هل أنت مستعد لتطوير أعمال التجميل الخاصة بك؟
            </h3>
            <p className="text-[18px] font-['Inter'] text-[#c8c5ca] mb-10 relative z-10 max-w-[600px] mx-auto leading-relaxed">
              انضم إلى مئات المحترفين الذين يستخدمون أدواتنا لتعزيز أعمالهم وتحقيق قفزات نوعية في الأداء والربحية باستخدام الذكاء الاصطناعي.
            </p>
            <Link to="/" className="inline-block relative z-10 px-10 py-4 bg-gradient-to-r from-fuchsia-600 to-cyan-500 rounded-xl font-['Space_Grotesk'] font-black text-white text-lg shadow-[0_10px_40px_rgba(192,38,211,0.3)] hover:shadow-[0_20px_60px_rgba(192,38,211,0.5)] transition-all duration-300 hover:scale-105 active:scale-95">
              ابدأ الآن مجاناً
            </Link>
            
            {/* Decorative accent */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-fuchsia-500/10 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-cyan-400/10 blur-[100px] rounded-full pointer-events-none"></div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default SingleArticle;
