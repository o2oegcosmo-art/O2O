import React, { useState, useEffect } from 'react';
import { Player } from '@remotion/player';
import { SalonIntro, ServiceSlide } from '../remotion/SalonIntro';
import { renderVideoOnClient } from '../engines/video-engine/browser-render';
import {
    Download, Sparkles, Image as ImageIcon,
    Save, Plus, Clock, X
} from 'lucide-react';
import api from '../api/config';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

// Video format presets
const VIDEO_FORMATS = [
    { id: 'landscape', label: 'أفقي (يوتيوب / فيسبوك)', icon: '🖥️', width: 1280, height: 720, ratio: '16:9' },
    { id: 'portrait', label: 'رأسي (ريلز / تيك توك)', icon: '📱', width: 720, height: 1280, ratio: '9:16' },
    { id: 'square', label: 'مربع (إنستجرام)', icon: '⬜', width: 1080, height: 1080, ratio: '1:1' },
];

// Slide duration options (in seconds)
const DURATION_OPTIONS = [
    { label: '3 ثوانٍ', seconds: 3 },
    { label: '5 ثوانٍ', seconds: 5 },
    { label: '7 ثوانٍ', seconds: 7 },
    { label: '10 ثوانٍ', seconds: 10 },
];

const BRANDING_FRAMES = 60; // 2 seconds at 30fps
const FPS = 30;

const VideoStudio: React.FC = () => {
    const [rendering, setRendering] = useState(false);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [projects, setProjects] = useState<any[]>([]);
    const [activeProject, setActiveProject] = useState<any>(null);

    // Video settings
    const [salonName, setSalonName] = useState('صالون مودرن');
    const [accentColor, setAccentColor] = useState('#d946ef');
    const [durationPerSlide, setDurationPerSlide] = useState(5); // seconds
    const [selectedFormat, setSelectedFormat] = useState(VIDEO_FORMATS[0]);
    const [slides, setSlides] = useState<ServiceSlide[]>([
        {
            imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
            name: 'قص شعر احترافي',
            price: '١٥٠ ج.م',
            description: 'أفضل تجربة قص شعر في المدينة'
        }
    ]);

    const durationPerSlideFrames = durationPerSlide * FPS;
    const totalFrames = BRANDING_FRAMES + slides.length * durationPerSlideFrames + BRANDING_FRAMES;

    useEffect(() => { fetchProjects(); }, []);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/video-projects');
            setProjects(res.data.data || []);
        } catch (e) {}
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await api.post('/video-projects', {
                id: activeProject?.id,
                name: `فيديو ${salonName}`,
                props: { salonName, accentColor, slides, durationPerSlide, formatId: selectedFormat.id },
                template_id: 'salon-intro-v2'
            });
            toast.success('تم حفظ المشروع');
            setActiveProject(res.data.data);
            fetchProjects();
        } catch (e) {
            toast.error('فشل الحفظ');
        } finally {
            setLoading(false);
        }
    };

    const loadProject = (p: any) => {
        setActiveProject(p);
        const props = p.props;
        setSalonName(props.salonName || 'صالون مودرن');
        setAccentColor(props.accentColor || '#d946ef');
        setSlides(props.slides || []);
        setDurationPerSlide(props.durationPerSlide || 5);
        const fmt = VIDEO_FORMATS.find(f => f.id === props.formatId) || VIDEO_FORMATS[0];
        setSelectedFormat(fmt);
    };

    const handleRender = async () => {
        const playerContainer = document.querySelector('[dir="ltr"]');
        const canvas = playerContainer?.querySelector('canvas');
        if (!canvas) { toast.error('لم يتم العثور على محرك العرض'); return; }
        setRendering(true);
        setProgress(0);
        try {
            const videoUrl = await renderVideoOnClient(canvas, totalFrames / FPS, FPS, (p) => setProgress(p)) as string;
            const a = document.createElement('a');
            a.href = videoUrl;
            a.download = `${salonName}-video.mp4`;
            a.click();
            toast.success('تم تحميل الفيديو بنجاح!');
        } catch (e) {
            toast.error('فشل في رندرة الفيديو');
        } finally {
            setRendering(false);
        }
    };

    const addSlide = () => {
        setSlides([...slides, {
            imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
            name: 'خدمة جديدة',
            price: '٠ ج.م',
            description: ''
        }]);
    };

    const updateSlide = (idx: number, field: keyof ServiceSlide, value: string) => {
        const updated = [...slides];
        updated[idx] = { ...updated[idx], [field]: value };
        setSlides(updated);
    };

    const removeSlide = (idx: number) => {
        if (slides.length === 1) { toast.error('يجب أن يكون هناك شريحة واحدة على الأقل'); return; }
        setSlides(slides.filter((_, i) => i !== idx));
    };

    const handleImageUpload = (idx: number, file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => updateSlide(idx, 'imageUrl', reader.result as string);
        reader.readAsDataURL(file);
    };

    // Compute video preview dimensions
    const previewMaxWidth = 480;
    const ratio = selectedFormat.width / selectedFormat.height;
    const previewWidth = ratio >= 1 ? previewMaxWidth : previewMaxWidth * ratio;
    const previewHeight = ratio >= 1 ? previewMaxWidth / ratio : previewMaxWidth;

    return (
        <div className="flex flex-col lg:flex-row gap-6 pb-20 animate-in fade-in duration-500">

            {/* LEFT: Preview */}
            <div className="flex-1 bg-[#121214] border border-white/5 rounded-[32px] p-6 flex flex-col items-center justify-start gap-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600/5 to-cyan-600/5 pointer-events-none" />

                {/* Format Selector */}
                <div className="flex gap-3 flex-wrap justify-center z-10">
                    {VIDEO_FORMATS.map(fmt => (
                        <button
                            key={fmt.id}
                            onClick={() => setSelectedFormat(fmt)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${selectedFormat.id === fmt.id ? 'bg-fuchsia-600/20 border-fuchsia-500 text-fuchsia-400' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30'}`}
                        >
                            <span>{fmt.icon}</span>
                            <span>{fmt.ratio}</span>
                            <span className="text-[10px] opacity-60">{fmt.label}</span>
                        </button>
                    ))}
                </div>

                {/* Player */}
                <div
                    style={{ width: previewWidth, height: previewHeight }}
                    className="bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative"
                    dir="ltr"
                >
                    <Player
                        component={SalonIntro as any}
                        inputProps={{ salonName, accentColor, slides, durationPerSlide: durationPerSlideFrames }}
                        durationInFrames={totalFrames}
                        fps={FPS}
                        compositionWidth={selectedFormat.width}
                        compositionHeight={selectedFormat.height}
                        style={{ width: '100%', height: '100%' }}
                        controls
                        loop
                        acknowledgeRemotionLicense
                    />
                </div>

                {/* Video Info */}
                <div className="flex gap-6 text-xs text-white/30 z-10">
                    <span>🎬 {slides.length} شريحة</span>
                    <span>⏱ {Math.round(totalFrames / FPS)} ثانية</span>
                    <span>📐 {selectedFormat.width}×{selectedFormat.height}</span>
                </div>

                {/* Render Button */}
                <button
                    onClick={handleRender}
                    disabled={rendering}
                    className="w-full max-w-sm py-4 bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 z-10"
                >
                    <Download size={20} />
                    {rendering ? `جاري التوليد... ${progress}%` : 'توليد وتحميل الفيديو MP4'}
                </button>

                {/* Rendering overlay */}
                {rendering && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50">
                        <div className="w-48 h-48 relative">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="96" cy="96" r="88" stroke="white" strokeOpacity="0.05" strokeWidth="8" fill="transparent" />
                                <motion.circle cx="96" cy="96" r="88" stroke="#d946ef" strokeWidth="8" fill="transparent"
                                    strokeDasharray={553} strokeDashoffset={553 - (553 * progress) / 100}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black">{progress}%</span>
                                <span className="text-[10px] text-white/40 mt-1">Rendering</span>
                            </div>
                        </div>
                        <p className="mt-6 text-white/50 text-sm animate-pulse">جاري توليد الفيديو على جهازك...</p>
                    </div>
                )}
            </div>

            {/* RIGHT: Controls */}
            <div className="w-full lg:w-[400px] flex flex-col gap-4">

                {/* Branding Settings */}
                <div className="bg-[#121214] border border-white/5 p-6 rounded-[28px] space-y-4">
                    <header className="flex justify-between items-center mb-2">
                        <h3 className="font-bold flex items-center gap-2 text-sm">
                            <Sparkles className="text-fuchsia-500" size={16} />
                            إعدادات العلامة التجارية
                        </h3>
                        <button onClick={handleSave} disabled={loading} title="حفظ المشروع"
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-xs font-bold">
                            <Save size={14} className={loading ? 'animate-spin' : ''} />
                            حفظ
                        </button>
                    </header>

                    <div className="space-y-2">
                        <label className="text-[10px] text-white/40 uppercase font-bold">اسم الصالون</label>
                        <input
                            value={salonName}
                            onChange={e => setSalonName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-fuchsia-500 transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="text-[10px] text-white/40 uppercase font-bold">لون الهوية</label>
                            <div className="flex gap-2 p-2 bg-white/5 border border-white/10 rounded-xl items-center">
                                <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                                    className="w-8 h-8 bg-transparent border-none cursor-pointer rounded-lg" />
                                <span className="text-[10px] font-mono opacity-40 uppercase">{accentColor}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] text-white/40 uppercase font-bold flex items-center gap-1">
                                <Clock size={10} /> مدة كل شريحة
                            </label>
                            <select
                                value={durationPerSlide}
                                onChange={e => setDurationPerSlide(Number(e.target.value))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-fuchsia-500 transition-all"
                            >
                                {DURATION_OPTIONS.map(d => (
                                    <option key={d.seconds} value={d.seconds} className="bg-[#0A0A0C]">{d.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Slides Manager */}
                <div className="bg-[#121214] border border-white/5 p-6 rounded-[28px] flex-1">
                    <header className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-sm flex items-center gap-2">
                            <ImageIcon size={16} className="text-cyan-400" />
                            الشرائح ({slides.length})
                        </h3>
                        <button onClick={addSlide} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400 text-xs font-bold hover:bg-cyan-500/20 transition-all">
                            <Plus size={14} />
                            شريحة جديدة
                        </button>
                    </header>

                    <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                        {slides.map((slide, idx) => (
                            <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-white/40">شريحة {idx + 1}</span>
                                    <button onClick={() => removeSlide(idx)} className="text-red-400/50 hover:text-red-400 transition-colors">
                                        <X size={14} />
                                    </button>
                                </div>

                                {/* Image */}
                                <div className="relative h-28 rounded-xl overflow-hidden bg-white/5 border border-white/10 group cursor-pointer">
                                    {slide.imageUrl && (
                                        <img src={slide.imageUrl} alt="" className="w-full h-full object-cover opacity-70" />
                                    )}
                                    <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all cursor-pointer gap-1">
                                        <ImageIcon size={20} className="text-white" />
                                        <span className="text-[10px] text-white font-bold">رفع صورة</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(idx, f); }} />
                                    </label>
                                    {!slide.imageUrl && (
                                        <div className="absolute inset-0 flex items-center justify-center text-white/20">
                                            <ImageIcon size={28} />
                                        </div>
                                    )}
                                </div>

                                {/* Fields */}
                                <input
                                    value={slide.name}
                                    onChange={e => updateSlide(idx, 'name', e.target.value)}
                                    placeholder="اسم الخدمة"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-fuchsia-500 transition-all"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        value={slide.price}
                                        onChange={e => updateSlide(idx, 'price', e.target.value)}
                                        placeholder="السعر"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-fuchsia-500 transition-all"
                                    />
                                    <input
                                        value={slide.description}
                                        onChange={e => updateSlide(idx, 'description', e.target.value)}
                                        placeholder="وصف مختصر"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-fuchsia-500 transition-all"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Saved Projects */}
                {projects.length > 0 && (
                    <div className="bg-[#121214] border border-white/5 p-4 rounded-[24px]">
                        <h4 className="text-[10px] font-bold text-white/30 uppercase mb-3">مشاريع محفوظة</h4>
                        <div className="space-y-2 max-h-[160px] overflow-y-auto">
                            {projects.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => loadProject(p)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${activeProject?.id === p.id ? 'bg-fuchsia-600/10 border-fuchsia-500/50' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                                >
                                    <div>
                                        <p className="text-xs font-bold truncate max-w-[200px]">{p.name}</p>
                                        <p className="text-[10px] text-white/30">{new Date(p.created_at).toLocaleDateString('ar-EG')}</p>
                                    </div>
                                    <span className="text-[10px] text-white/20">{p.props?.slides?.length || 1} شرائح</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoStudio;
