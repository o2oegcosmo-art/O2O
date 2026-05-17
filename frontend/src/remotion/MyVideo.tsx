import { AbsoluteFill, useVideoConfig, useCurrentFrame, interpolate, spring, Img, Sequence } from 'remotion';
import React from 'react';

interface MyVideoProps {
    salonName: string;
    serviceName: string;
    price: string;
    images: string[];
    template: 'quick' | 'full';
}

const Scene: React.FC<{
    imageUrl: string;
    index: number;
    totalScenes: number;
    salonName: string;
    serviceName: string;
    price: string;
}> = ({ imageUrl, salonName, serviceName, price }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Cinematic zoom and pan (Ken Burns effect)
    const zoom = interpolate(frame, [0, 150], [1, 1.15], {
        extrapolateRight: 'clamp',
    });
    
    const panY = interpolate(frame, [0, 150], [0, -50], {
        extrapolateRight: 'clamp',
    });

    // Animations for text elements
    const spr = (delay: number) => spring({
        frame: frame - delay,
        fps,
        config: { damping: 12 }
    });

    const titleOpacity = spr(10);
    const titleScale = interpolate(spr(10), [0, 1], [0.8, 1]);
    
    const priceOpacity = spr(30);
    const priceY = interpolate(spr(30), [0, 1], [50, 0]);

    return (
        <AbsoluteFill style={{ backgroundColor: '#000', overflow: 'hidden' }}>
            {/* Background Image with Ken Burns Effect */}
            <div style={{
                width: '100%',
                height: '100%',
                transform: `scale(${zoom}) translateY(${panY}px)`,
            }}>
                <Img 
                    src={imageUrl} 
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'brightness(0.75)'
                    }}
                />
            </div>

            {/* Premium Overlay Gradient */}
            <AbsoluteFill style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 40%, transparent 100%)'
            }} />

            {/* Branding - Top */}
            <div style={{
                position: 'absolute',
                top: 80,
                width: '100%',
                textAlign: 'center',
                opacity: titleOpacity,
                transform: `scale(${titleScale})`,
                zIndex: 10
            }}>
                <div style={{
                    display: 'inline-block',
                    padding: '8px 24px',
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '50px',
                    color: '#fff',
                    fontSize: 32,
                    fontWeight: 600,
                    fontFamily: 'Inter, system-ui',
                    letterSpacing: 2
                }}>
                    {salonName.toUpperCase()}
                </div>
            </div>

            {/* Content Info - Bottom */}
            <div style={{
                position: 'absolute',
                bottom: 120,
                width: '100%',
                padding: '0 60px',
                zIndex: 10,
                direction: 'rtl'
            }}>
                <div style={{
                    opacity: titleOpacity,
                    transform: `translateX(${interpolate(spr(15), [0, 1], [100, 0])}px)`
                }}>
                    <h2 style={{
                        color: '#fff',
                        fontSize: 80,
                        fontWeight: 900,
                        margin: 0,
                        lineHeight: 1.1,
                        textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        fontFamily: 'Outfit, sans-serif'
                    }}>
                        {serviceName}
                    </h2>
                </div>

                <div style={{
                    marginTop: 30,
                    opacity: priceOpacity,
                    transform: `translateY(${priceY}px)`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20
                }}>
                    <div style={{
                        background: 'linear-gradient(90deg, #8B5CF6, #EC4899)',
                        padding: '15px 40px',
                        borderRadius: '20px',
                        color: '#fff',
                        fontSize: 54,
                        fontWeight: 800,
                        boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)'
                    }}>
                        {price} ج.م
                    </div>
                    <div style={{
                        color: '#fff',
                        fontSize: 28,
                        fontWeight: 500,
                        opacity: 0.8
                    }}>
                        لفترة محدودة
                    </div>
                </div>
            </div>

            {/* Dynamic Light Streaks Overlay */}
            <AbsoluteFill style={{
                background: 'radial-gradient(circle at 0% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
                pointerEvents: 'none'
            }} />
        </AbsoluteFill>
    );
};

export const MyVideo: React.FC<MyVideoProps> = ({ 
    salonName, 
    serviceName, 
    price, 
    images, 
    template 
}) => {
    // const videoConfig = useVideoConfig();
    
    // Ensure we have images, fallback to quality placeholders if empty
    const displayImages = images && images.length > 0 ? images : [
        "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1080&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1080&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1080&auto=format&fit=crop"
    ];

    const sceneDuration = template === 'quick' ? 150 : 300; // 5 or 10 seconds per scene

    return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
            {displayImages.map((img, index) => (
                <Sequence 
                    key={index} 
                    from={index * sceneDuration} 
                    durationInFrames={sceneDuration}
                >
                    <Scene 
                        imageUrl={img} 
                        index={index} 
                        totalScenes={displayImages.length}
                        salonName={salonName}
                        serviceName={serviceName}
                        price={price}
                    />
                </Sequence>
            ))}
        </AbsoluteFill>
    );
};
