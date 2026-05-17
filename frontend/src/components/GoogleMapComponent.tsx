import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

interface Props {
    lat?: number;
    lng?: number;
    isEditable?: boolean;
    onLocationSelect?: (lat: number, lng: number) => void;
    markers?: { lat: number, lng: number, title?: string }[];
}

const GoogleMapComponent: React.FC<Props> = ({ lat, lng, isEditable, onLocationSelect, markers }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const [isMapReady, setIsMapReady] = useState(false);

    useEffect(() => {
        if (!mapRef.current) return;

        // تحميل Leaflet ديناميكياً لتجنب مشاكل SSR أو Build
        import('leaflet').then((L) => {
            if (mapInstanceRef.current) return;

            // إصلاح أيقونات الدبابيس
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            });

            const initialLat = lat || 30.0444;
            const initialLng = lng || 31.2357;

            // إنشاء الخريطة
            const map = L.map(mapRef.current!, {
                center: [initialLat, initialLng],
                zoom: 13,
                zoomControl: true,
                attributionControl: false
            });

            // استخدام طبقة داكنة احترافية (CartoDB Dark)
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                maxZoom: 19,
            }).addTo(map);

            // إضافة الدبوس الرئيسي إذا كان هناك إحداثيات
            if (lat && lng) {
                markerRef.current = L.marker([lat, lng], { draggable: isEditable }).addTo(map);
                
                if (isEditable) {
                    markerRef.current.on('dragend', (event: any) => {
                        const position = event.target.getLatLng();
                        if (onLocationSelect) onLocationSelect(position.lat, position.lng);
                    });
                }
            }

            // إضافة علامات متعددة (إذا وجدت)
            if (markers) {
                markers.forEach(m => {
                    L.marker([m.lat, m.lng]).addTo(map).bindPopup(m.title || '');
                });
            }

            // تفعيل اختيار الموقع عند الضغط
            if (isEditable) {
                map.on('click', (e: any) => {
                    const { lat, lng } = e.latlng;
                    if (markerRef.current) {
                        markerRef.current.setLatLng(e.latlng);
                    } else {
                        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
                    }
                    if (onLocationSelect) onLocationSelect(lat, lng);
                });
            }

            mapInstanceRef.current = map;
            setIsMapReady(true);
            
            // تصحيح حجم الخريطة بعد التحميل
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        });

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // تحديث مكان الدبوس عند تغيير الإحداثيات من الخارج
    useEffect(() => {
        if (mapInstanceRef.current && lat && lng) {
            const newPos = [lat, lng] as [number, number];
            mapInstanceRef.current.setView(newPos, mapInstanceRef.current.getZoom());
            if (markerRef.current) {
                markerRef.current.setLatLng(newPos);
            } else {
                import('leaflet').then((L) => {
                   markerRef.current = L.marker(newPos, { draggable: isEditable }).addTo(mapInstanceRef.current);
                });
            }
        }
    }, [lat, lng]);

    return (
        <div className="relative w-full h-[400px] group">
            <div 
                ref={mapRef} 
                className="w-full h-full rounded-3xl border-2 border-white/5 shadow-2xl overflow-hidden"
                style={{ background: '#1a1a1a' }}
            />
            {!isMapReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A0C] rounded-3xl z-10">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-fuchsia-500/20 border-t-fuchsia-500 rounded-full animate-spin" />
                        <span className="text-white/40 font-bold text-sm tracking-widest uppercase">جاري تهيئة الخريطة...</span>
                    </div>
                </div>
            )}
            {isEditable && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest">اضغط على الخريطة لتحديد موقع الصالون</span>
                </div>
            )}
        </div>
    );
};

export default React.memo(GoogleMapComponent);
