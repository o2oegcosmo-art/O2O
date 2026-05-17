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
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const TermsAndConditions = lazy(() => import('@/pages/TermsAndConditions'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const RequestTrialPage = lazy(() => import('@/pages/RequestTrialPage'));
const HelpCenter = lazy(() => import('@/pages/HelpCenter'));

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
  // 🛡️ Multi-Session Strategy: Use role-specific keys if specified, fallback to generic
  let tokenKey = 'o2oeg_token';
  let userKey = 'o2oeg_user';

  if (allowedRole === 'admin') { tokenKey = 'o2oeg_token_admin'; userKey = 'o2oeg_user_admin'; }
  else if (allowedRole === 'salon') { tokenKey = 'o2oeg_token_salon'; userKey = 'o2oeg_user_salon'; }
  else if (allowedRole === 'company') { tokenKey = 'o2oeg_token_company'; userKey = 'o2oeg_user_company'; }
  else if (allowedRole === 'affiliate') { tokenKey = 'o2oeg_token_affiliate'; userKey = 'o2oeg_user_affiliate'; }

  const token = localStorage.getItem(tokenKey) || sessionStorage.getItem(tokenKey);
  const userStr = localStorage.getItem(userKey) || sessionStorage.getItem(userKey);
  
  console.log(`🔍 [O2OEG AUTH] Path: ${window.location.pathname} | Key: ${tokenKey} | Found: ${!!token}`);
  
  let user: any = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    console.error("Auth Guard: Failed to parse user data");
    return <Navigate to="/login" replace />;
  }

  const clearSession = () => {
    [tokenKey, userKey].forEach(k => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
  };

  if (!token || !user) {
    clearSession();
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role;
  const isCompany = user.business_category === 'company';

  // 🛠️ Robust Role Identification: Support all variants of salon roles including Manager
  // 🛡️ Safety Fallback: If role is empty but tenant_id exists, treat as salon
  const effectiveRole = (userRole === 'tenant_admin' || userRole === 'owner' || userRole === 'salon' || userRole === 'manager' || (userRole === '' && user.tenant_id)) ? 'salon' : userRole;

  if (allowedRole) {
    let accessDenied = false;
    if (allowedRole === 'admin' && userRole !== 'admin') accessDenied = true;
    else if (allowedRole === 'company' && !isCompany) accessDenied = true;
    else if (allowedRole === 'affiliate' && userRole !== 'affiliate') accessDenied = true;
    else if (allowedRole === 'salon' && effectiveRole !== 'salon') accessDenied = true;

    if (accessDenied) {
      console.error(`🚨 ACCESS DENIED: Path ${window.location.pathname} requires ${allowedRole}, but user has role: "${userRole}" and tenant: ${user.tenant_id}`);
      // Clear specific session if it's a mismatch to force fresh login
      clearSession();
      return <Navigate to="/login?error=unauthorized" replace />;
    }
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
              <Link
                  to="/request-trial"
                  className="bg-gradient-to-r from-fuchsia-600 to-cyan-500 text-white font-semibold px-6 py-2 rounded-lg hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(192,38,211,0.3)] text-sm inline-block text-center">
                  ابدأ الآن
              </Link>
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
                  <Link to="/request-trial" onClick={() => setIsOpen(false)} className="w-full text-center bg-gradient-to-r from-fuchsia-600 to-cyan-500 text-white font-bold py-3 rounded-xl text-sm block">ابدأ الآن مجاناً</Link>
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

  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '10.0.2.2';
  const subdomain = isLocal ? '' : hostname.split('.')[0];
  const isBaseDomain = subdomain === 'o2oeg' || subdomain === 'www' || subdomain === '';
  const isAdminDomain = subdomain === 'admin';
  const isSalonDomain = subdomain === 'salon';

  const isTenantSubdomain = subdomain && subdomain !== 'www' && subdomain !== 'admin' && subdomain !== 'salon' && subdomain !== 'o2oeg';
  const isCustomDomain = !isLocal && !hostname.includes('o2oeg.com');

  const isDashboard = location.pathname.startsWith('/salon') || 
                      location.pathname.startsWith('/admin') || 
                      location.pathname.startsWith('/company') ||
                      location.pathname.startsWith('/affiliate') ||
                      location.pathname.startsWith('/complete-profile');

  // 🏛️ White Label Logic: Render Salon Profile for tenant subdomains and custom domains
  if ((isTenantSubdomain || isCustomDomain) && !isLocal) {
    return (
      <div style={{ minHeight: '100vh', position: 'relative', background: 'var(--background)' }}>
        <div className="gradient-bg" />
        <Suspense fallback={<PageLoader />}>
          <SalonPublicPage />
        </Suspense>
      </div>
    );
  }

  // Logic to determine what to render based on subdomain
  if (!isLocal) {
    if (isAdminDomain && !location.pathname.startsWith('/admin') && location.pathname !== '/login') {
      return <Navigate to="/admin" replace />;
    }
    if (isSalonDomain && !location.pathname.startsWith('/salon') && location.pathname !== '/login') {
      return <Navigate to="/salon" replace />;
    }
  }

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
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/salon/:id" element={<SalonPublicPage />} />
          
          {/* Protected Dashboard Routes */}
          <Route path="/company" element={<ProtectedRoute allowedRole="company"><CompanyDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/salon" element={<ProtectedRoute allowedRole="salon"><SalonDashboard /></ProtectedRoute>} />
          <Route path="/affiliate" element={<ProtectedRoute allowedRole="affiliate"><AffiliateDashboard /></ProtectedRoute>} />

          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/request-trial" element={<RequestTrialPage />} />
          <Route path="/docs" element={<HelpCenter />} />

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
        <footer className="bg-[#0A0A0C] border-t border-white/5 py-12 px-6 flex flex-col items-center gap-6 relative z-10">
          <div className="flex gap-8 flex-wrap justify-center">
            <Link to="/privacy-policy" className="text-white/40 hover:text-cyan-400 transition-colors font-bold text-xs tracking-wide">سياسة الخصوصية</Link>
            <Link to="/terms-and-conditions" className="text-white/40 hover:text-cyan-400 transition-colors font-bold text-xs tracking-wide">الشروط والأحكام</Link>
            <Link to="/docs" className="text-white/40 hover:text-cyan-400 transition-colors font-bold text-xs tracking-wide">التوثيق</Link>
            <a href="https://wa.me/201044167626" target="_blank" className="text-white/40 hover:text-cyan-400 transition-colors font-bold text-xs tracking-wide">تواصل معنا</a>
          </div>
          <p className="text-white/20 text-[11px] font-bold tracking-[0.2em]">© 2026 O2OEG AI-FIRST SAAS PLATFORM. جميع الحقوق محفوظة.</p>
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
