import React from 'react';
import {
    AbsoluteFill,
    interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig,
    Img,
    Sequence
} from 'remotion';

export interface ServiceSlide {
    imageUrl: string;
    name: string;
    price: string;
    description: string;
}

export interface SalonIntroProps {
    salonName: string;
    accentColor: string;
    slides: ServiceSlide[];
    durationPerSlide: number; // in frames
}

const SingleSlide: React.FC<{
    slide: ServiceSlide;
    accentColor: string;
    totalFrames: number;
}> = ({ slide, accentColor, totalFrames }) => {
    const frame = useCurrentFrame();

    const entrance = spring({ frame, fps: 30, config: { damping: 14 } });
    const scale = interpolate(frame, [0, totalFrames], [1, 1.18]);
    const textOpacity = interpolate(frame, [0, 15, totalFrames - 15, totalFrames], [0, 1, 1, 0]);

    return (
        <AbsoluteFill style={{ backgroundColor: '#0a0a0c', overflow: 'hidden', direction: 'ltr' }}>
            {/* Background Image Ken Burns */}
            <AbsoluteFill style={{ transform: `scale(${scale})` }}>
                <Img
                    src={slide.imageUrl}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }}
                />
            </AbsoluteFill>

            {/* Gradient */}
            <AbsoluteFill style={{
                background: 'linear-gradient(to top, #0a0a0c 30%, rgba(10,10,12,0.4) 100%)'
            }} />

            {/* Content */}
            <AbsoluteFill style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'flex-end',
                paddingBottom: '120px', paddingLeft: '80px', paddingRight: '80px'
            }}>
                <div style={{ opacity: textOpacity, textAlign: 'center', transform: `translateY(${(1 - entrance) * 80}px)` }}>
                    {/* Service Name */}
                    <h2 style={{
                        color: 'white',
                        fontSize: '72px',
                        fontWeight: 900,
                        margin: '0 0 16px 0',
                        textShadow: '0 4px 24px rgba(0,0,0,0.8)'
                    }}>
                        {slide.name}
                    </h2>

                    {/* Description */}
                    {slide.description && (
                        <p style={{
                            color: 'rgba(255,255,255,0.75)',
                            fontSize: '40px',
                            margin: '0 0 40px 0',
                        }}>
                            {slide.description}
                        </p>
                    )}

                    {/* Price Badge */}
                    <div style={{
                        display: 'inline-block',
                        padding: '18px 64px',
                        backgroundColor: accentColor,
                        borderRadius: '100px',
                        boxShadow: `0 0 60px ${accentColor}88`
                    }}>
                        <span style={{ color: 'white', fontSize: '56px', fontWeight: 900 }}>
                            {slide.price}
                        </span>
                    </div>
                </div>
            </AbsoluteFill>

            {/* Flash In */}
            <AbsoluteFill style={{
                backgroundColor: 'black',
                opacity: interpolate(frame, [0, 8], [1, 0])
            }} />

            {/* Flash Out */}
            <AbsoluteFill style={{
                backgroundColor: 'black',
                opacity: interpolate(frame, [totalFrames - 8, totalFrames], [0, 1])
            }} />
        </AbsoluteFill>
    );
};

// Intro/Outro: Salon branding screen
const BrandingScreen: React.FC<{ salonName: string; accentColor: string }> = ({ salonName, accentColor }) => {
    const frame = useCurrentFrame();
    const entrance = spring({ frame, fps: 30, config: { damping: 12 } });

    return (
        <AbsoluteFill style={{ backgroundColor: '#0a0a0c', display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'ltr' }}>
            {/* Glowing circle */}
            <div style={{
                position: 'absolute',
                width: '600px', height: '600px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${accentColor}33 0%, transparent 70%)`,
                opacity: interpolate(frame, [0, 30], [0, 1])
            }} />

            <div style={{
                textAlign: 'center',
                transform: `scale(${0.7 + entrance * 0.3})`,
                opacity: entrance
            }}>
                <h1 style={{
                    color: accentColor,
                    fontSize: '140px',
                    fontWeight: 900,
                    margin: 0,
                    letterSpacing: '-2px',
                    textShadow: `0 0 80px ${accentColor}66`
                }}>
                    {salonName}
                </h1>
                <div style={{
                    width: '120px', height: '4px',
                    background: accentColor,
                    borderRadius: '2px',
                    margin: '30px auto'
                }} />
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '36px', margin: 0 }}>
                    O2OEG AI BEAUTY PLATFORM
                </p>
            </div>

            {/* Flash out */}
            <AbsoluteFill style={{
                backgroundColor: 'black',
                opacity: interpolate(frame, [55, 60], [0, 1])
            }} />
        </AbsoluteFill>
    );
};

export const SalonIntro: React.FC<SalonIntroProps> = ({
    salonName,
    accentColor,
    slides,
    durationPerSlide
}) => {
    const BRANDING_FRAMES = 60;
    const slideFrames = durationPerSlide;

    return (
        <AbsoluteFill>
            {/* Branding Intro */}
            <Sequence from={0} durationInFrames={BRANDING_FRAMES}>
                <BrandingScreen salonName={salonName} accentColor={accentColor} />
            </Sequence>

            {/* Service Slides */}
            {slides.map((slide, i) => (
                <Sequence key={i} from={BRANDING_FRAMES + i * slideFrames} durationInFrames={slideFrames}>
                    <SingleSlide slide={slide} accentColor={accentColor} totalFrames={slideFrames} />
                </Sequence>
            ))}

            {/* Branding Outro */}
            <Sequence from={BRANDING_FRAMES + slides.length * slideFrames} durationInFrames={BRANDING_FRAMES}>
                <BrandingScreen salonName={salonName} accentColor={accentColor} />
            </Sequence>
        </AbsoluteFill>
    );
};
