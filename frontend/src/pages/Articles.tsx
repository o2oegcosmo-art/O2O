import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Send } from 'lucide-react';
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

const categories = ["الكل", "إدارة الصالونات", "نمو الشركات", "دليل المسوقين", "دليل العملاء"];

const Articles: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("الكل");

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response = await api.get('/articles');
      setArticles(response.data.data);
    } catch (error) {
      console.error("Error fetching articles", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const filteredArticles = selectedCategory === "الكل" 
    ? articles 
    : articles.filter(a => a.category === selectedCategory);

  return (
    <div style={{ minHeight: '100vh', background: '#050505', position: 'relative', overflow: 'hidden', paddingBottom: '10rem' }}>
      {/* ===== EXPERT AMBIENT BACKGROUND ===== */}
      <div style={{
        position: 'absolute', top: '-20%', right: '-10%', width: '60vw', height: '60vw',
        background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', left: '-10%', width: '50vw', height: '50vw',
        background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0
      }} />
      {/* Subtle Grid Background for SaaS feel */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none', zIndex: 1,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse at top, black 40%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse at top, black 40%, transparent 80%)'
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 10, paddingTop: '10rem', maxWidth: '1400px' }}>
        
        {/* ===== EXPERT HERO SECTION ===== */}
        <header style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '6rem' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 1rem', borderRadius: '999px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              marginBottom: '2rem'
            }}>
              <Sparkles size={14} color="var(--primary)" />
              <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                O2OEG Insights
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(3rem, 8vw, 5.5rem)', fontWeight: '900', lineHeight: '1.1',
              letterSpacing: '-0.03em', marginBottom: '1.5rem', color: '#fff'
            }}>
              مستقبل قطاع التجميل، <br />
              <span style={{ 
                background: 'linear-gradient(135deg, #fff 0%, #a1a1aa 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>
                يُكتب هنا.
              </span>
            </h1>

            <p style={{
              fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: '#a1a1aa', maxWidth: '600px', margin: '0 auto',
              lineHeight: '1.8', fontWeight: '400'
            }}>
              رؤى تقنية، تحليلات استراتيجية، وأسرار النمو. محتوى مُصمم خصيصاً لقادة ورواد صناعة التجميل في العالم العربي.
            </p>
          </motion.div>
        </header>

        {/* ===== CATEGORIES NAVIGATION ===== */}
        <div style={{
          display: 'flex', gap: '0.5rem', marginBottom: '4rem', paddingBottom: '1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto', WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none', msOverflowStyle: 'none'
        }} className="categories-row">
          {categories.map((cat) => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '0.6rem 1.25rem', borderRadius: '999px',
                fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap',
                background: selectedCategory === cat ? 'white' : 'transparent',
                color: selectedCategory === cat ? '#000' : '#a1a1aa',
                border: selectedCategory === cat ? '1px solid white' : '1px solid transparent',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={(e) => { if (selectedCategory !== cat) e.currentTarget.style.color = 'white'; }}
              onMouseLeave={(e) => { if (selectedCategory !== cat) e.currentTarget.style.color = '#a1a1aa'; }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ===== ARTICLES GRID ===== */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
             {[1,2,3].map(i => (
               <div key={i} style={{ aspectRatio: '4/5', background: 'rgba(255,255,255,0.02)', borderRadius: '1.5rem', animation: 'pulse 2s infinite' }} />
             ))}
          </div>
        ) : filteredArticles.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2.5rem' }} className="articles-bento">
            <AnimatePresence mode='popLayout'>
              {filteredArticles.map((article, index) => (
                <motion.article 
                  key={article.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: index * 0.1 }}
                  style={{
                    position: 'relative',
                    borderRadius: '1.5rem',
                    overflow: 'hidden',
                    background: 'rgba(20,20,20,0.5)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    // The first item gets featured styling on desktop
                    ...(index === 0 && selectedCategory === 'الكل' ? { gridColumn: '1 / -1', flexDirection: 'row', minHeight: '500px' } : { aspectRatio: '4/5' })
                  }}
                  className={`group ${index === 0 && selectedCategory === 'الكل' ? 'featured-article-card' : ''}`}
                >
                  <Link to={`/articles/${article.slug}`} style={{ display: 'flex', flexDirection: index === 0 && selectedCategory === 'الكل' ? 'row' : 'column', height: '100%', width: '100%', textDecoration: 'none' }}>
                  {/* Image Section */}
                  <div style={{
                    flex: index === 0 && selectedCategory === 'الكل' ? '1.2' : 'none',
                    height: index === 0 && selectedCategory === 'الكل' ? 'auto' : '50%',
                    position: 'relative', overflow: 'hidden'
                  }} className="article-image-container">
                    <img 
                      src={article.image || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1200'} 
                      alt={article.title}
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                      className="group-hover:scale-105"
                    />
                    {/* Inner shadow/gradient for smooth transition to text */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: index === 0 && selectedCategory === 'الكل' 
                        ? 'linear-gradient(to left, rgba(20,20,20,1) 0%, transparent 40%)' 
                        : 'linear-gradient(to top, rgba(20,20,20,1) 0%, transparent 60%)'
                    }} className="article-gradient-overlay" />
                  </div>

                  {/* Content Section */}
                  <div style={{
                    flex: '1', padding: '2.5rem', display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', position: 'relative', zIndex: 2
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                      <span style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.05em' }}>
                        {article.category}
                      </span>
                      <span style={{ color: '#52525b', fontSize: '0.75rem', fontWeight: '600' }}>
                        {new Date(article.created_at).toLocaleDateString('ar-EG', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    
                    <h3 style={{
                      fontSize: index === 0 && selectedCategory === 'الكل' ? 'clamp(1.8rem, 3vw, 2.8rem)' : '1.5rem',
                      fontWeight: '800', lineHeight: '1.3', color: '#fff', marginBottom: '1rem',
                      letterSpacing: '-0.02em'
                    }}>
                      {article.title}
                    </h3>
                    
                    <p style={{ color: '#a1a1aa', lineHeight: '1.7', fontSize: '0.95rem', marginBottom: '2rem' }} className="line-clamp-3">
                      {article.content}
                    </p>

                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', fontWeight: '800' }}>
                          {article.author.charAt(0)}
                        </div>
                        <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600' }}>{article.author}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/articles/' + article.slug)}`, '_blank');
                          }}
                          style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(25, 119, 242, 0.1)', color: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(`https://wa.me/?text=${encodeURIComponent(article.title + ' ' + window.location.origin + '/articles/' + article.slug)}`, '_blank');
                          }}
                          style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(37, 211, 102, 0.1)', color: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
                        >
                          <Send size={14} />
                        </button>
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', transition: 'all 0.3s'
                        }} className="read-more-btn">
                          <ArrowLeft size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                  </Link>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '8rem 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
             <p style={{ color: '#52525b', fontSize: '1.25rem', fontWeight: '600' }}>لا توجد مقالات في هذا التصنيف حالياً.</p>
          </div>
        )}
      </div>

      {/* Global styles for this component to handle hovers and responsive */}
      <style>{`
        .group:hover img { transform: scale(1.05); }
        .group:hover .read-more-btn { background: white !important; color: black !important; }
        
        @media (max-width: 1024px) {
          .featured-article-card {
            grid-column: span 1 !important;
            flex-direction: column !important;
            min-height: auto !important;
            aspect-ratio: auto !important;
          }
          .featured-article-card .article-image-container {
            height: 300px !important;
            flex: none !important;
          }
          .featured-article-card .article-gradient-overlay {
            background: linear-gradient(to top, rgba(20,20,20,1) 0%, transparent 60%) !important;
          }
          .featured-article-card h3 {
            font-size: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Articles;
