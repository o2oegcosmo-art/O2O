import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

export const renderVideoOnClient = async (
    canvas: HTMLCanvasElement, 
    durationInSeconds: number, 
    fps: number,
    onProgress: (p: number) => void
) => {
    return new Promise(async (resolve, reject) => {
        try {
            const totalFrames = durationInSeconds * fps;
            
            // 1. Setup Muxer with ArrayBufferTarget
            let muxer = new Muxer({
                target: new ArrayBufferTarget(),
                video: {
                    codec: 'avc',
                    width: canvas.width,
                    height: canvas.height
                },
                fastStart: 'in-memory'
            });

            // 2. Setup VideoEncoder
            let encoder = new VideoEncoder({
                output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
                error: (e) => {
                    console.error('Encoder Error:', e);
                    reject(e);
                }
            });

            encoder.configure({
                codec: 'avc1.42E01E',
                width: canvas.width,
                height: canvas.height,
                bitrate: 5_000_000,
                framerate: fps
            });

            // 3. Render Frames
            for (let i = 0; i < totalFrames; i++) {
                const frame = new VideoFrame(canvas, { timestamp: (i * 1000000) / fps });
                encoder.encode(frame, { keyFrame: i % 30 === 0 });
                frame.close();

                onProgress(Math.round((i / totalFrames) * 100));
                
                if (i % 10 === 0) await new Promise(r => setTimeout(r, 0));
            }

            // 4. Finalize
            await encoder.flush();
            muxer.finalize();

            let { buffer } = muxer.target as ArrayBufferTarget;
            const blob = new Blob([buffer], { type: 'video/mp4' });
            resolve(URL.createObjectURL(blob));

        } catch (error) {
            reject(error);
        }
    });
};
