import React, { useEffect, useState } from 'react';
import api from '../api/config';
import { ExternalLink, Sparkles } from 'lucide-react';

const AdContainer: React.FC<{ showAds: boolean }> = ({ showAds }) => {
    const [ad, setAd] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!showAds) return;

        const fetchAd = async () => {
            try {
                const res = await api.get('/events/promoted-ad');
                setAd(res.data);
            } catch (err) {
                console.error("Failed to load ad");
            } finally {
                setLoading(false);
            }
        };

        fetchAd();
    }, [showAds]);

    const handleAdClick = async () => {
        if (!ad) return;
        // تتبع النقرة برمجياً قبل التوجيه
        try {
            await api.post(`/events/${ad.id}/track-click`);
            window.open(`/events/${ad.id}`, '_blank');
        } catch (err) { console.error("Tracking failed"); }
    };

    if (!showAds || (!ad && !loading)) return null;

    return (
        <div className="glass-card ad-container" style={{
            margin: '1.5rem 0',
            padding: '1rem',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            background: 'linear-gradient(45deg, rgba(139, 92, 246, 0.05), rgba(217, 70, 239, 0.05))'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                <Sparkles size={14} className="text-primary" />
                <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary)' }}>
                    فاعليات مقترحة لك
                </span>
            </div>

            {loading ? (
                <div className="skeleton" style={{ height: '120px', borderRadius: '0.5rem' }}></div>
            ) : ad && (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <img src={ad.image_url} alt={ad.title} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '0.75rem' }} />
                    <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.4rem' }}>{ad.title}</h4>
                        <button onClick={handleAdClick} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
                            احجز مكانك الآن <ExternalLink size={12} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdContainer;