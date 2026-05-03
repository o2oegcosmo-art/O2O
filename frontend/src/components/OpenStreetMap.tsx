import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

interface Marker {
    lat: number;
    lng: number;
    title?: string;
}

interface OpenStreetMapProps {
    markers?: Marker[];
    center?: [number, number];
    zoom?: number;
}

export default function OpenStreetMap({ 
    markers = [], 
    center = [30.0444, 31.2357], // القاهرة
    zoom = 11 
}: OpenStreetMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        // تحميل Leaflet ديناميكياً
        import('leaflet').then((L) => {
            // إصلاح أيقونة الدبوس في Leaflet مع Vite
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            });

            // إنشاء الخريطة
            const map = L.map(mapRef.current!, {
                center,
                zoom,
                zoomControl: true,
                attributionControl: false,
            });

            // طبقة OpenStreetMap المجانية
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap',
                maxZoom: 19,
            }).addTo(map);

            // أيقونة مخصصة للمندوبين
            const customIcon = L.divIcon({
                html: `<div style="
                    width: 36px; height: 36px;
                    background: linear-gradient(135deg, #06b6d4, #8b5cf6);
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    border: 3px solid white;
                    box-shadow: 0 4px 12px rgba(6,182,212,0.5);
                "></div>`,
                className: '',
                iconSize: [36, 36],
                iconAnchor: [18, 36],
                popupAnchor: [0, -36],
            });

            // إضافة علامات المندوبين
            markers.forEach((marker) => {
                L.marker([marker.lat, marker.lng], { icon: customIcon })
                    .addTo(map)
                    .bindPopup(`
                        <div style="font-family: 'Cairo', sans-serif; direction: rtl; text-align: right; padding: 4px;">
                            <strong style="color: #06b6d4; font-size: 13px;">${marker.title || 'زيارة ميدانية'}</strong>
                        </div>
                    `);
            });

            // إذا لم توجد علامات، عرض نقطة القاهرة كمثال
            if (markers.length === 0) {
                const demoMarkers = [
                    { lat: 30.0444, lng: 31.2357, title: 'أحمد علي - صالون النور، وسط القاهرة' },
                    { lat: 30.0626, lng: 31.2497, title: 'محمد سامي - صالون الجمال، مصر الجديدة' },
                    { lat: 30.0131, lng: 31.2089, title: 'خالد حسن - صالون بلسم، المعادي' },
                ];
                demoMarkers.forEach((dm) => {
                    L.marker([dm.lat, dm.lng], { icon: customIcon })
                        .addTo(map)
                        .bindPopup(`
                            <div style="font-family: sans-serif; direction: rtl; text-align: right; padding: 4px;">
                                <strong style="color: #06b6d4; font-size: 12px;">${dm.title}</strong>
                                <p style="color: #888; font-size: 10px; margin-top: 2px;">بيانات تجريبية</p>
                            </div>
                        `);
                });
            }

            mapInstanceRef.current = map;
        });

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    return (
        <div 
            ref={mapRef} 
            style={{ width: '100%', height: '100%', borderRadius: '24px' }}
        />
    );
}
