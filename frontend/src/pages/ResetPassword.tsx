import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft, Shield } from 'lucide-react';
import api from '../api/config';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');
  const phone = searchParams.get('phone');

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token || !phone) {
      setError("رابط غير صالح. يرجى طلب رابط جديد من صفحة تسجيل الدخول.");
    }
  }, [token, phone]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      setError("كلمات المرور غير متطابقة.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await api.post('/password/reset', {
        token,
        phone,
        password,
        password_confirmation: passwordConfirmation
      });
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "فشل إعادة تعيين كلمة المرور.");
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

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '480px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{ padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}
        >
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.5rem' }}>تعيين كلمة مرور جديدة</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>أدخل كلمة المرور الجديدة لحسابك الخاص بـ {phone}</p>
          </div>

          {isSuccess ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ textAlign: 'center', padding: '1rem' }}
            >
              <div style={{ width: '64px', height: '64px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <CheckCircle size={40} color="#22c55e" />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem' }}>تم التغيير بنجاح!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>جاري تحويلك لصفحة تسجيل الدخول...</p>
              <Link to="/login" className="btn-primary" style={{ display: 'inline-block', padding: '0.75rem 2rem' }}>دخول الآن</Link>
            </motion.div>
          ) : (
            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {error && (
                <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '0.5rem', fontSize: '0.85rem', textAlign: 'center' }}>
                  {error}
                </div>
              )}

              {/* كلمة المرور الجديدة */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem', textAlign: 'right' }}>كلمة المرور الجديدة</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="#94a3b8" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    style={inputStyle}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* تأكيد كلمة المرور */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem', textAlign: 'right' }}>تأكيد كلمة المرور</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="#94a3b8" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    style={inputStyle}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !!error && !token}
                className="btn-primary"
                style={{ width: '100%', padding: '1rem', marginTop: '0.5rem' }}
              >
                {isLoading ? 'جاري الحفظ...' : 'حفظ كلمة المرور الجديدة'}
              </button>

              <Link to="/login" style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <ArrowLeft size={16} /> العودة لتسجيل الدخول
              </Link>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <div style={{ 
              display: 'inline-flex', alignItems: 'center', justifySelf: 'center', gap: '0.5rem', 
              margin: '0 auto', padding: '0.5rem 1rem', background: 'rgba(34, 197, 94, 0.05)', 
              borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.1)' 
            }}>
              <Shield size={14} className="text-green-500" />
              <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'rgba(34, 197, 94, 0.6)', letterSpacing: '0.05em' }}>O2OEG SECURE RESET</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
