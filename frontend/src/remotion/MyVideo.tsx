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
            fontSize: '90px',
            fontWeight: '900',
            color: 'white',
            textShadow: '0 4px 30px rgba(0,0,0,0.8)',
            marginBottom: '30px',
            fontFamily,
          }}
        >
          {title}
        </div>
        <div
          style={{
            transform: `scale(${textSpring})`,
            fontSize: '50px',
            fontWeight: '600',
            color,
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: '15px 40px',
            borderRadius: '20px',
            backdropFilter: 'blur(10px)',
            border: `2px solid ${color}44`,
            fontFamily,
          }}
        >
          {subtitle}
        </div>

        {/* Bottom CTA Branding */}
        <div
          style={{
            position: 'absolute',
            bottom: '80px',
            fontSize: '24px',
            fontWeight: '600',
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '4px',
            fontFamily,
            textTransform: 'uppercase'
          }}
        >
          O2OEG Content Studio
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const MyVideo: React.FC = () => {
  const { fps } = useVideoConfig();
  const sceneDuration = 3 * fps; // 3 seconds per scene

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <Audio 
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" 
        volume={0.5}
      />
      <Series>
        <Series.Sequence durationInFrames={sceneDuration}>
          <Scene
            title="O2O Content Studio"
            subtitle="مستقبلك في صناعة المحتوى بدأ الآن"
            imageUrl="https://picsum.photos/1080/1920?random=1"
            color="#22d3ee"
          />
        </Series.Sequence>

        <Series.Sequence durationInFrames={sceneDuration}>
          <Scene
            title="خطط أسبوعية ذكية"
            subtitle="الذكاء الاصطناعي يخطط لك كل منشوراتك"
            imageUrl="https://picsum.photos/1080/1920?random=2"
            color="#f472b6"
          />
        </Series.Sequence>

        <Series.Sequence durationInFrames={sceneDuration}>
          <Scene
            title="محتوى إبداعي"
            subtitle="حول أفكارك لنصوص وتصاميم في ثوانٍ"
            imageUrl="https://picsum.photos/1080/1920?random=3"
            color="#fbbf24"
          />
        </Series.Sequence>

        <Series.Sequence durationInFrames={sceneDuration}>
          <Scene
            title="نصائح إعلانية"
            subtitle="ضاعف أرباحك بخطط إعلانية مدروسة"
            imageUrl="https://picsum.photos/1080/1920?random=4"
            color="#10b981"
          />
        </Series.Sequence>

        <Series.Sequence durationInFrames={sceneDuration}>
          <Scene
            title="ابدأ الآن مجاناً"
            subtitle="انضم لعالم O2OEG اليوم"
            imageUrl="https://picsum.photos/1080/1920?random=5"
            color="#ffffff"
          />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
