import React, { useState } from 'react';
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
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/login', { phone, password });
      const data = response.data;

      // تخزين التوكن وبيانات المستخدم
      localStorage.setItem('o2oeg_token', data.access_token);
      localStorage.setItem('o2oeg_user', JSON.stringify(data.user));
      
      setLoggedInUser(data.user);
      setShowWelcome(true);

      // توجيه للوحة التحكم بناءً على الدور بعد 2.5 ثانية من الترحيب
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
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem' }}>رقم الموبايل (واتساب)</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} color="#94a3b8" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="tel"
                  required
                  placeholder="01xxxxxxxxx"
                  style={inputStyle}
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9+]/g, '');
                    setPhone(val);
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
                <a href="#" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600' }}>نسيت كلمة المرور؟</a>
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
    </div>
  );
};

export default LoginPage;
