import React, { useState, useEffect, FC, Suspense, lazy, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Components (Static)
import LeadForm from '@/components/LeadForm';

// Pages (Lazy Loaded for Performance & IDE Stability)
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const Articles = lazy(() => import('@/pages/Articles'));
const SingleArticle = lazy(() => import('@/pages/SingleArticle'));
const EventsPage = lazy(() => import('@/pages/EventsPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const SalonPublicPage = lazy(() => import('@/pages/SalonPublicPage'));
const CompanyDashboard = lazy(() => import('@/pages/CompanyDashboard'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const SalonDashboard = lazy(() => import('@/pages/SalonDashboard'));
const DiscoveryPage = lazy(() => import('@/pages/DiscoveryPage'));
const AffiliateDashboard = lazy(() => import('@/pages/AffiliateDashboard'));
const CompleteProfile = lazy(() => import('@/pages/CompleteProfile'));

// Loading Placeholder
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-[#0A0A0C]">
    <div className="w-10 h-10 border-4 border-fuchsia-500/20 border-t-fuchsia-500 rounded-full animate-spin" />
  </div>
);

// Protected Route Guard (Security Enhancement)
interface User {
  role: 'admin' | 'salon' | 'company' | 'affiliate';
  business_category?: 'salon' | 'company';
  name: string;
}

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRole?: 'admin' | 'salon' | 'company' | 'affiliate';
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const token = localStorage.getItem('o2oeg_token');
  const userStr = localStorage.getItem('o2oeg_user');
  const user: User | null = userStr ? JSON.parse(userStr) : null;

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Role-based access control
  if (allowedRole) {
    const userRole = user.role;
    if (allowedRole === 'admin' && userRole !== 'admin') return <Navigate to="/salon" replace />;
    if (allowedRole === 'company' && user.business_category !== 'company') return <Navigate to="/salon" replace />;
    if (allowedRole === 'affiliate' && userRole !== 'affiliate') return <Navigate to="/salon" replace />;
  }

  return <React.Fragment>{children}</React.Fragment>;
};

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

interface NavbarProps {
  openForm: (type: 'salon' | 'company' | 'affiliate') => void;
}

const Navbar: FC<NavbarProps> = ({ openForm }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const isHome = location.pathname === '/';

  return (
    <nav dir="rtl" className="fixed top-0 w-full z-50 bg-[#0A0A0C]/80 backdrop-blur-2xl border-b border-white/10 shadow-[0px_4px_24px_rgba(0,0,0,0.5)] font-['Inter']">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-[1440px] mx-auto">
          <Link to="/" className="flex flex-col items-center justify-center" onClick={() => setIsOpen(false)}>
              <span className="text-2xl font-black text-white tracking-tighter font-['Space_Grotesk']">O2O EG</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-fuchsia-500 font-bold">AI Beauty Hub</span>
          </Link>

          <div className="hidden md:flex items-center gap-10">
              <Link to="/" className={`font-bold border-b-2 pb-1 text-[12px] uppercase tracking-widest font-['Space_Grotesk'] ${isHome ? 'text-cyan-400 border-cyan-400' : 'text-white/60 hover:text-white border-transparent transition-colors'}`}>الرئيسية</Link>
              <Link to="/articles" className={`font-bold border-b-2 pb-1 text-[12px] uppercase tracking-widest font-['Space_Grotesk'] ${location.pathname === '/articles' ? 'text-cyan-400 border-cyan-400' : 'text-white/60 hover:text-white border-transparent transition-colors'}`}>المقالات</Link>
              <Link to="/events" className={`font-bold border-b-2 pb-1 text-[12px] uppercase tracking-widest font-['Space_Grotesk'] ${location.pathname === '/events' ? 'text-cyan-400 border-cyan-400' : 'text-white/60 hover:text-white border-transparent transition-colors'}`}>فاعليات وتدريب</Link>
              <Link to="/discovery" className={`font-bold border-b-2 pb-1 text-[12px] uppercase tracking-widest font-['Space_Grotesk'] ${location.pathname === '/discovery' ? 'text-cyan-400 border-cyan-400' : 'text-white/60 hover:text-white border-transparent transition-colors'}`}>اكتشف صالونات</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
              <Link to="/login" className="text-white/60 hover:text-white transition-all font-semibold px-4 py-2 text-sm">تسجيل الدخول</Link>
              <button
                  onClick={() => openForm('salon')}
                  className="bg-gradient-to-r from-fuchsia-600 to-cyan-500 text-white font-semibold px-6 py-2 rounded-lg hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(192,38,211,0.3)] text-sm">
                  ابدأ الآن
              </button>
          </div>

          <button
              className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-[5px] rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm"
              onClick={() => setIsOpen(!isOpen)}
          >
              <span className={`w-5 h-[2px] bg-white transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-[7px]' : ''}`}></span>
              <span className={`w-5 h-[2px] bg-white transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`}></span>
              <span className={`w-5 h-[2px] bg-white transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-[7px]' : ''}`}></span>
          </button>
      </div>

      {isOpen && (
          <div className="md:hidden bg-[#0A0A0C]/95 backdrop-blur-2xl border-t border-white/10 px-6 py-6 flex flex-col gap-4">
              <Link to="/" onClick={() => setIsOpen(false)} className={`text-sm font-bold tracking-widest py-3 border-b border-white/5 ${isHome ? 'text-cyan-400' : 'text-white/60'}`}>الرئيسية</Link>
              <Link to="/articles" onClick={() => setIsOpen(false)} className={`text-sm font-bold tracking-widest py-3 border-b border-white/5 ${location.pathname === '/articles' ? 'text-cyan-400' : 'text-white/60'}`}>المقالات</Link>
              <Link to="/events" onClick={() => setIsOpen(false)} className={`text-sm font-bold tracking-widest py-3 border-b border-white/5 ${location.pathname === '/events' ? 'text-cyan-400' : 'text-white/60'}`}>فاعليات وتدريب</Link>
              <Link to="/discovery" onClick={() => setIsOpen(false)} className={`text-sm font-bold tracking-widest py-3 border-b border-white/5 ${location.pathname === '/discovery' ? 'text-cyan-400' : 'text-white/60'}`}>اكتشف صالونات</Link>
              <div className="flex flex-col gap-3 pt-4">
                  <Link to="/login" onClick={() => setIsOpen(false)} className="w-full text-center text-white/60 border border-white/10 rounded-xl py-3 text-sm font-semibold">تسجيل الدخول</Link>
                  <button onClick={() => { setIsOpen(false); openForm('salon'); }} className="w-full bg-gradient-to-r from-fuchsia-600 to-cyan-500 text-white font-bold py-3 rounded-xl text-sm">ابدأ الآن مجاناً</button>
              </div>
          </div>
      )}
    </nav>
  );
}

function AppContent() {
  const location = useLocation();
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState<'salon' | 'company' | 'affiliate'>('salon');

  const openForm = (type: 'salon' | 'company' | 'affiliate') => {
    setSelectedInterest(type);
    setIsLeadFormOpen(true);
  };

  const isDashboard = location.pathname.startsWith('/salon') || 
                      location.pathname.startsWith('/admin') || 
                      location.pathname.startsWith('/company') ||
                      location.pathname.startsWith('/affiliate') ||
                      location.pathname.startsWith('/complete-profile');

  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: 'var(--background)' }}>
      <div className="gradient-bg" />
      {!isDashboard && <Navbar openForm={openForm} />}
      
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage openForm={openForm} />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/articles/:slug" element={<SingleArticle />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/discovery" element={<DiscoveryPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/salon/:id" element={<SalonPublicPage />} />
          
          {/* Protected Dashboard Routes */}
          <Route path="/company" element={<ProtectedRoute allowedRole="company"><CompanyDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/salon" element={<ProtectedRoute><SalonDashboard /></ProtectedRoute>} />
          <Route path="/affiliate" element={<ProtectedRoute allowedRole="affiliate"><AffiliateDashboard /></ProtectedRoute>} />

          {/* 404 Route */}
          <Route path="*" element={
            <div className="h-screen flex flex-col items-center justify-center text-center px-6">
              <h1 className="text-9xl font-black text-white/5">404</h1>
              <h2 className="text-2xl font-bold mt-4">الصفحة غير موجودة</h2>
              <p className="text-white/40 mt-2">عذراً، المسار الذي تحاول الوصول إليه غير متاح حالياً.</p>
              <Link to="/" className="mt-8 px-8 py-3 bg-fuchsia-600 text-white rounded-xl font-bold">العودة للرئيسية</Link>
            </div>
          } />
        </Routes>
      </Suspense>

      {!isDashboard && (
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '700' }}>
          <p>© 2026 O2OEG AI-FIRST SAAS PLATFORM. جميع الحقوق محفوظة.</p>
        </footer>
      )}

      <LeadForm isOpen={isLeadFormOpen} onClose={() => setIsLeadFormOpen(false)} initialInterest={selectedInterest} />
    </div>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppContent />
      <Toaster position="top-left" />
    </Router>
  );
}

export default App;
