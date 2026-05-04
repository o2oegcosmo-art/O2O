import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { MyVideo } from './MyVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="QuickAds"
        component={MyVideo}
        durationInFrames={450} // 15 Seconds (5 scenes * 3s)
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
            salonName: "صالونك المتألق",
            serviceName: "خدمة مميزة",
            price: "150",
            template: 'quick' as const,
            images: ["https://picsum.photos/1080/1920?random=1", "https://picsum.photos/1080/1920?random=2", "https://picsum.photos/1080/1920?random=3"]
        }}
      />
      <Composition
        id="FullShow"
        component={MyVideo}
        durationInFrames={1200} // 40 Seconds (8 scenes * 5s)
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
            salonName: "صالونك المتألق",
            serviceName: "خدمة ملكية متكاملة",
            price: "500",
            template: 'full' as const,
            images: ["https://picsum.photos/1080/1920?random=1", "https://picsum.photos/1080/1920?random=2", "https://picsum.photos/1080/1920?random=3"]
        }}
      />
    </>
  );
};

registerRoot(RemotionRoot);
