import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Phone, Eye, EyeOff, CheckCircle, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/config';

const LoginPage: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotPhone, setForgotPhone] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 🛡️ Multi-Session Fix: Check role-specific keys first to avoid cross-session redirects
    // This prevents the admin from being redirected to /salon when a salon session is also open
    
    const adminToken = localStorage.getItem('o2oeg_token_admin') || sessionStorage.getItem('o2oeg_token_admin');
    const salonToken = localStorage.getItem('o2oeg_token_salon') || sessionStorage.getItem('o2oeg_token_salon');
    const companyToken = localStorage.getItem('o2oeg_token_company') || sessionStorage.getItem('o2oeg_token_company');
    const affiliateToken = localStorage.getItem('o2oeg_token_affiliate') || sessionStorage.getItem('o2oeg_token_affiliate');

    // Determine the current page context based on URL params or simply do NOT auto-redirect
    // when multiple sessions exist — let the user choose manually
    const adminUserStr = localStorage.getItem('o2oeg_user_admin') || sessionStorage.getItem('o2oeg_user_admin');
    const salonUserStr = localStorage.getItem('o2oeg_user_salon') || sessionStorage.getItem('o2oeg_user_salon');
    const companyUserStr = localStorage.getItem('o2oeg_user_company') || sessionStorage.getItem('o2oeg_user_company');
    const affiliateUserStr = localStorage.getItem('o2oeg_user_affiliate') || sessionStorage.getItem('o2oeg_user_affiliate');

    // ✅ التحقق من أن التوكن ليس منتهي الصلاحية (بشكل بسيط) قبل إعادة التوجيه
    const isTokenValid = (token: string | null, userStr: string | null): boolean => {
      if (!token || !userStr) return false;
      try {
        const u = JSON.parse(userStr);
        // Allow all valid salon-related roles
        const salonRoles = ['tenant_admin', 'owner', 'salon', 'manager'];
        return !!u.role && (u.role === 'admin' || u.role === 'affiliate' || salonRoles.includes(u.role) || u.business_category === 'company');
      } catch {
        return false;
      }
    };

    // Count active sessions with valid data
    const activeSessions = [
      isTokenValid(adminToken, adminUserStr),
      isTokenValid(salonToken, salonUserStr),
      isTokenValid(companyToken, companyUserStr),
      isTokenValid(affiliateToken, affiliateUserStr)
    ].filter(Boolean).length;

    // If only ONE session is active, auto-redirect.
    if (activeSessions === 1) {
      if (isTokenValid(adminToken, adminUserStr)) navigate('/admin');
      else if (isTokenValid(affiliateToken, affiliateUserStr)) navigate('/affiliate');
      else if (isTokenValid(companyToken, companyUserStr)) navigate('/company');
      else if (isTokenValid(salonToken, salonUserStr)) navigate('/salon');
    }
    // If multiple sessions open OR no session: stay on login page (no redirect)
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/login', { phone, password, remember: rememberMe });
      const data = response.data;

      // 🔧 Multi-Session Strategy: Store token in role-specific keys to prevent session overlap
      let tokenKey = 'o2oeg_token';
      let userKey = 'o2oeg_user';
      
      const userRole = data.user.role;
      if (userRole === 'admin') { tokenKey = 'o2oeg_token_admin'; userKey = 'o2oeg_user_admin'; }
      else if (userRole === 'affiliate') { tokenKey = 'o2oeg_token_affiliate'; userKey = 'o2oeg_user_affiliate'; }
      else if (data.user.business_category === 'company') { tokenKey = 'o2oeg_token_company'; userKey = 'o2oeg_user_company'; }
      else { tokenKey = 'o2oeg_token_salon'; userKey = 'o2oeg_user_salon'; }

      // 🛡️ Deep Clean: Clear ALL other possible role keys before storing the new one
      const allKeys = [
        'o2oeg_token', 'o2oeg_user',
        'o2oeg_token_admin', 'o2oeg_user_admin',
        'o2oeg_token_salon', 'o2oeg_user_salon',
        'o2oeg_token_company', 'o2oeg_user_company',
        'o2oeg_token_affiliate', 'o2oeg_user_affiliate'
      ];
      allKeys.forEach(k => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });

      localStorage.setItem(tokenKey, data.access_token);
      localStorage.setItem(userKey, JSON.stringify(data.user));
      
      console.log(`🚀 [AUTH SUCCESS] Stored as: ${tokenKey} | Role: ${userRole}`);
      
      // إذا كان "تذكرني" مفعل، نحفظ العلم أيضاً
      if (rememberMe) {
        localStorage.setItem('o2oeg_remember', 'true');
      } else {
        localStorage.removeItem('o2oeg_remember');
      }
      
      setLoggedInUser(data.user);
      setShowWelcome(true);

      setTimeout(() => {
        if (data.user.role === 'admin') {
          navigate('/admin');
        } else if (data.user.role === 'affiliate') {
          navigate('/affiliate');
        } else if (data.user.business_category === 'company') {
          navigate('/company');
        } else {
          navigate('/salon');
        }
      }, 2500);

    } catch (err: any) {
      if (err.response?.status === 429) {
        setError("تم رصد نشاط مشبوه! يرجى الانتظار قليلاً قبل إعادة المحاولة.");
      } else {
        setError(err.response?.data?.message || "فشل تسجيل الدخول. تأكد من البيانات.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);

    try {
      const response = await api.post('/password/forgot', { phone: forgotPhone });
      setForgotSuccess(response.data.message);
      // إغلاق المودال بعد 3 ثواني
      setTimeout(() => setShowForgotModal(false), 3000);
    } catch (err: any) {
      setForgotError(err.response?.data?.message || "حدث خطأ أثناء إرسال الطلب.");
    } finally {
      setIsForgotLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '0.75rem',
    padding: '0.85rem 2.75rem 0.85rem 3rem',
    color: 'var(--text)',
    fontSize: '0.95rem',
    textAlign: 'right',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'all 0.3s',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: '1rem'
    }}>
      {/* Background Glows */}
      <div style={{
        position: 'absolute', top: '10%', left: '20%', width: '40vw', height: '40vw',
        background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '20%', width: '40vw', height: '40vw',
        background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '480px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card"
          style={{ padding: 'clamp(1.5rem, 5vw, 3rem) clamp(1.25rem, 5vw, 2.5rem)', display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative', overflow: 'hidden' }}
        >
          {/* Welcome Overlay */}
          <AnimatePresence>
            {showWelcome && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute', inset: 0, zIndex: 100,
                  background: '#0A0A0C',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  textAlign: 'center', padding: '2rem'
                }}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    width: 80, height: 80, borderRadius: '24px',
                    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '1.5rem', boxShadow: '0 0 40px rgba(139,92,246,0.3)'
                  }}
                >
                  <CheckCircle size={40} color="white" />
                </motion.div>
                <motion.h2
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  style={{ fontSize: '1.75rem', fontWeight: '900', marginBottom: '0.5rem' }}
                >
                  أهلاً بك، {loggedInUser?.name}
                </motion.h2>
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}
                >
                  جاري تحضير لوحة التحكم الخاصة بك...
                </motion.p>
                
                {/* Progress Bar */}
                <div style={{ width: '120px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginTop: '2rem', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    style={{ height: '100%', background: 'linear-gradient(to left, #8b5cf6, #ec4899)' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: '900', marginBottom: '1.5rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
              }}>O</div>
              O2OEG
            </Link>
            <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 1.75rem)', fontWeight: '800', marginBottom: '0.5rem' }}>تسجيل الدخول</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>مرحباً بك مجدداً في لوحة التحكم الذكية</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  fontSize: '0.85rem',
                  textAlign: 'center'
                }}
              >
                {error}
              </motion.div>
            )}

            {/* رقم الموبايل */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem' }}>رقم الموبايل أو البريد الإلكتروني</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} color="#94a3b8" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  name="login"
                  id="login"
                  inputMode="email"
                  autoComplete="username"
                  required
                  placeholder="01xxxxxxxxx أو admin@o2oeg.com"
                  style={inputStyle}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              </div>
            </div>

            {/* كلمة المرور */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>كلمة المرور</label>
                <button 
                  type="button" 
                  onClick={() => setShowForgotModal(true)} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600' }}
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="#94a3b8" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  style={inputStyle}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: showPassword ? 'var(--primary)' : '#94a3b8',
                    display: 'flex', alignItems: 'center', padding: '0.25rem',
                    transition: 'color 0.2s'
                  }}
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* تذكرني */}
            <label style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              cursor: 'pointer', userSelect: 'none', fontSize: '0.9rem', color: 'var(--text-muted)'
            }}>
              <div
                onClick={() => setRememberMe(!rememberMe)}
                style={{
                  width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                  border: `2px solid ${rememberMe ? 'var(--primary)' : 'rgba(255,255,255,0.15)'}`,
                  background: rememberMe ? 'var(--primary)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', cursor: 'pointer'
                }}
              >
                {rememberMe && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span onClick={() => setRememberMe(!rememberMe)}>تذكرني على هذا الجهاز</span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
              style={{ width: '100%', padding: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'center' }}
            >
              {isLoading ? (
                <span className="animate-pulse">جاري التحقق...</span>
              ) : (
                <>الدخول للوحة التحكم <ArrowRight size={18} style={{ transform: 'rotate(180deg)', marginRight: '0.5rem' }} /></>
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              ليس لديك حساب؟ <a href="/" style={{ color: 'white', fontWeight: '700' }}>سجل اهتمامك الآن</a>
            </div>
            
            <div style={{ 
              display: 'inline-flex', alignItems: 'center', justifySelf: 'center', gap: '0.5rem', 
              margin: '0 auto', padding: '0.5rem 1rem', background: 'rgba(34, 197, 94, 0.05)', 
              borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.1)' 
            }}>
              <Shield size={14} className="text-green-500" />
              <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'rgba(34, 197, 94, 0.6)', letterSpacing: '0.05em' }}>SECURED BY O2OEG AI SHIELD</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
          }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card"
              style={{
                width: '100%', maxWidth: '400px', padding: '2rem',
                position: 'relative', zIndex: 1001, border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem', textAlign: 'right' }}>استعادة كلمة المرور</h3>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', textAlign: 'right', lineHeight: '1.6' }}>
                أدخل رقم الموبايل المسجل وسنرسل لك رابطاً على الواتساب لتعيين كلمة مرور جديدة.
              </p>

              {forgotSuccess ? (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <div style={{ width: '50px', height: '50px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <CheckCircle size={30} color="#22c55e" />
                  </div>
                  <p style={{ color: '#22c55e', fontSize: '0.9rem', fontWeight: 'bold' }}>{forgotSuccess}</p>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {forgotError && (
                    <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '0.5rem', fontSize: '0.8rem', textAlign: 'center' }}>
                      {forgotError}
                    </div>
                  )}
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.5rem', textAlign: 'right' }}>رقم الموبايل</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={18} color="#94a3b8" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="tel"
                        required
                        placeholder="01xxxxxxxxx"
                        style={inputStyle}
                        value={forgotPhone}
                        onChange={(e) => setForgotPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'white', fontWeight: '700', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={isForgotLoading}
                      style={{ flex: 1.5, padding: '0.75rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: 'white', fontWeight: '900', border: 'none', boxShadow: '0 4px 15px rgba(139,92,246,0.3)' }}
                    >
                      {isForgotLoading ? 'جاري الإرسال...' : 'إرسال الرابط'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
