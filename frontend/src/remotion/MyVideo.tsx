import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
  Series,
  Audio,
} from 'remotion';
import { loadFont } from "@remotion/google-fonts/Cairo";

const { fontFamily } = loadFont();

interface SceneProps {
  title: string;
  subtitle: string;
  imageUrl: string;
  color: string;
}

const Scene: React.FC<SceneProps> = ({ title, subtitle, imageUrl, color }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const scale = interpolate(frame, [0, durationInFrames], [1, 1.15]);
  const opacity = interpolate(frame, [0, 10, durationInFrames - 10, durationInFrames], [0, 1, 1, 0]);

  const textSpring = spring({
    frame,
    fps,
    config: { damping: 12 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: 'black', opacity }}>
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        <Img
          src={imageUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.5)',
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '60px',
          direction: 'rtl',
          fontFamily,
        }}
      >
        <div
          style={{
            transform: `translateY(${interpolate(textSpring, [0, 1], [40, 0])}px)`,
            fontSize: '80px',
            fontWeight: '900',
            color: 'white',
            textShadow: '0 4px 30px rgba(0,0,0,0.8)',
            marginBottom: '20px',
            fontFamily,
          }}
        >
          {title}
        </div>
        <div
          style={{
            transform: `scale(${textSpring})`,
            fontSize: '40px',
            fontWeight: '600',
            color,
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: '12px 35px',
            borderRadius: '20px',
            backdropFilter: 'blur(10px)',
            border: `2px solid ${color}44`,
            fontFamily,
          }}
        >
          {subtitle}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '80px',
            fontSize: '20px',
            fontWeight: '600',
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '3px',
            fontFamily,
            textTransform: 'uppercase'
          }}
        >
          O2OEG Marketing Engine
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export interface MyVideoProps {
    salonName?: string;
    serviceName?: string;
    price?: string;
    images?: string[];
    template?: 'quick' | 'full';
}

export const MyVideo: React.FC<MyVideoProps> = ({ 
    salonName = "صالونك المتألق", 
    serviceName = "خدمة مميزة", 
    price = "99", 
    images = [
        "https://picsum.photos/1080/1920?random=1",
        "https://picsum.photos/1080/1920?random=2",
        "https://picsum.photos/1080/1920?random=3"
    ],
    template = 'quick'
}) => {
  const { fps } = useVideoConfig();
  const sceneDuration = template === 'quick' ? 3 * fps : 5 * fps; // 3s for quick, 5s for full

  const scenes = template === 'quick' ? [
    { title: `مرحباً بك في`, subtitle: salonName, color: "#22d3ee", img: images[0] },
    { title: `عرض خاص على`, subtitle: serviceName, color: "#f472b6", img: images[1] },
    { title: `سعر لا يقاوم`, subtitle: `${price} ج.م فقط`, color: "#fbbf24", img: images[2] },
    { title: `احجزي الآن`, subtitle: "عبر تطبيق O2OEG", color: "#10b981", img: images[0] },
    { title: `ننتظر زيارتك`, subtitle: "سيصلك كود الخصم فوراً", color: "#ffffff", img: images[1] }
  ] : [
    { title: `اكتشفي الجمال في`, subtitle: salonName, color: "#22d3ee", img: images[0] },
    { title: `تجربة فريدة مع`, subtitle: serviceName, color: "#f472b6", img: images[1] },
    { title: `احترافية وأناقة`, subtitle: "بأيدي خبراء متخصصين", color: "#fbbf24", img: images[2] },
    { title: `سعر العرض الحالي`, subtitle: `${price} ج.م`, color: "#10b981", img: images[0] },
    { title: `لماذا تختاريننا؟`, subtitle: "أفضل الخامات وأرقى خدمة", color: "#22d3ee", img: images[1] },
    { title: `استشارة مجانية`, subtitle: "مدعومة بالذكاء الاصطناعي", color: "#f472b6", img: images[2] },
    { title: `احجزي مكانك الآن`, subtitle: "المقاعد محدودة جداً", color: "#fbbf24", img: images[0] },
    { title: `حملي التطبيق`, subtitle: "O2OEG - رفيقك للجمال", color: "#10b981", img: images[1] }
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <Audio 
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" 
        volume={0.5}
      />
      <Series>
        {scenes.map((scene, i) => (
            <Series.Sequence key={i} durationInFrames={sceneDuration}>
                <Scene
                    title={scene.title}
                    subtitle={scene.subtitle}
                    imageUrl={scene.img || images[0]}
                    color={scene.color}
                />
            </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};

