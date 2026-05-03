import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { MyVideo } from './MyVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="StudioIntro"
        component={MyVideo}
        durationInFrames={450} // 15 Seconds (5 scenes * 3s)
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};

registerRoot(RemotionRoot);
