import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  Link as LinkIcon, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  Copy,
  ExternalLink,
  Wallet,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/config';

interface Stats {
  promo_code: string;
  commission_percentage: number;
  balance: number;
  total_earned: number;
  clicks_count: number;
  referred_tenants_count: number;
  pending_commissions: number;
}

const AffiliateDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, commRes] = await Promise.all([
        api.get('/affiliate/stats'),
        api.get('/affiliate/commissions')
      ]);
      setStats(statsRes.data);
      setCommissions(commRes.data.data);
    } catch (err) {
      console.error('Failed to fetch affiliate data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyRefLink = () => {
    if (!stats) return;
    const link = `${window.location.origin}/ref/${stats.promo_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">جاري التحميل...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '0.5rem' }}>لوحة شركاء O2OEG</h1>
          <p style={{ color: 'var(--text-muted)' }}>تتبع أداءك وعمولاتك في مكان واحد</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => {
            localStorage.removeItem('o2oeg_token');
            navigate('/login');
          }} className="btn-secondary">تسجيل الخروج</button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {/* Referral Link Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card" 
          style={{ gridColumn: 'span 2', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(0,0,0,0) 100%)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <LinkIcon size={24} />
            </div>
            <div>
              <h3 style={{ fontWeight: '800' }}>رابط التسويق الخاص بك</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>شارك هذا الرابط مع أصحاب الصالونات والشركات</p>
            </div>
          </div>
          
          <div style={{ 
            display: 'flex', 
            background: 'rgba(255,255,255,0.05)', 
            padding: '1rem', 
            borderRadius: '1rem', 
            border: '1px solid rgba(255,255,255,0.1)',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <code style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: '700', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {window.location.origin}/ref/{stats?.promo_code}
            </code>
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <button 
                onClick={() => window.open(`${window.location.origin}/ref/${stats?.promo_code}`, '_blank')}
                title="فتح الرابط في المتصفح"
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  color: 'white', 
                  padding: '0.5rem 0.75rem', 
                  borderRadius: '0.75rem', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s'
                }}
              >
                <ExternalLink size={16} />
              </button>
              <button 
                onClick={copyRefLink}
                style={{ 
                  background: copied ? '#10b981' : 'var(--primary)', 
                  border: 'none', 
                  color: 'white', 
                  padding: '0.5rem 1.5rem', 
                  borderRadius: '0.75rem', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s'
                }}
              >
                {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                {copied ? 'تم النسخ' : 'نسخ الرابط'}
              </button>
            </div>
          </div>

          {/* Performance Row */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(59,130,246,0.1)', borderRadius: '0.75rem', border: '1px solid rgba(59,130,246,0.2)' }}>
              <ArrowUpRight size={16} color="#3b82f6" />
              <span style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: '700' }}>{stats?.clicks_count ?? 0} نقرة</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(16,185,129,0.1)', borderRadius: '0.75rem', border: '1px solid rgba(16,185,129,0.2)' }}>
              <TrendingUp size={16} color="#10b981" />
              <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '700' }}>{stats?.referred_tenants_count ?? 0} عميل مسجل</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(139,92,246,0.1)', borderRadius: '0.75rem', border: '1px solid rgba(139,92,246,0.2)' }}>
              <DollarSign size={16} color="var(--primary)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '700' }}>نسبة العمولة: {stats?.commission_percentage ?? 0}%</span>
            </div>
          </div>
        </motion.div>

        {/* Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card" 
          style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem', border: '2px solid rgba(139,92,246,0.3)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>الرصيد الحالي</span>
            <Wallet size={20} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '900' }}>{stats?.balance.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: '500' }}>ج.م</span></h2>
          <button className="btn-primary" style={{ width: '100%' }}>طلب سحب الأرباح</button>
        </motion.div>
      </div>

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        {[
          { label: 'إجمالي النقرات', value: stats?.clicks_count, icon: BarChart3, color: '#3b82f6' },
          { label: 'العملاء المسجلين', value: stats?.referred_tenants_count, icon: Users, color: '#10b981' },
          { label: 'إجمالي الأرباح', value: stats?.total_earned, icon: DollarSign, color: '#f59e0b' },
          { label: 'عمولات معلقة', value: stats?.pending_commissions, icon: Clock, color: '#ef4444' },
        ].map((item, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + idx * 0.1 }}
            className="glass-card" 
            style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
          >
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: `${item.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
              <item.icon size={20} />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{item.label}</p>
              <h4 style={{ fontSize: '1.25rem', fontWeight: '800' }}>{item.value?.toLocaleString()}</h4>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Commissions Table */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>آخر العمليات</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>نسبة عمولتك الحالية: {stats?.commission_percentage}%</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>العميل</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>التاريخ</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>مبلغ العمولة</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((comm) => (
                <tr key={comm.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '700' }}>{comm.tenant?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {comm.tenant?.id.substring(0,8)}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>{new Date(comm.created_at).toLocaleDateString('ar-EG')}</td>
                  <td style={{ padding: '1rem', fontWeight: '800', color: 'white' }}>{comm.amount} ج.م</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '2rem', 
                      fontSize: '0.75rem', 
                      fontWeight: '700',
                      background: comm.status === 'paid' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                      color: comm.status === 'paid' ? '#10b981' : '#f59e0b',
                      border: `1px solid ${comm.status === 'paid' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`
                    }}>
                      {comm.status === 'paid' ? 'تم الدفع' : comm.status === 'approved' ? 'معتمدة' : 'قيد المراجعة'}
                    </span>
                  </td>
                </tr>
              ))}
              {commissions.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>لا توجد عمليات بعد. ابدأ بمشاركة رابطك!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AffiliateDashboard;
