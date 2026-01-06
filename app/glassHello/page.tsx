'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export default function GlassHelloPage() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const outputCanvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Disable right-click to prevent inspect
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            return false;
        };
        document.addEventListener('contextmenu', handleContextMenu);
        return () => document.removeEventListener('contextmenu', handleContextMenu);
    }, []);

    const CANVAS_WIDTH = 1000;
    const CANVAS_HEIGHT = 400;

    // Apply fisheye/barrel distortion to create spoon-like mirror effect
    const applyFisheyeDistortion = useCallback((
        sourceData: ImageData,
        destData: ImageData,
        width: number,
        height: number
    ) => {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.max(width, height) / 2;
        const strength = 1.5; // Distortion strength for spoon-like effect

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // Normalize coordinates to -1 to 1
                const nx = (x - centerX) / radius;
                const ny = (y - centerY) / radius;
                const r = Math.sqrt(nx * nx + ny * ny);

                let srcX: number, srcY: number;

                if (r < 1.5) {
                    // Apply barrel distortion (convex mirror effect)
                    const theta = Math.atan2(ny, nx);
                    const newR = Math.pow(r, strength);

                    srcX = centerX + newR * radius * Math.cos(theta);
                    srcY = centerY + newR * radius * Math.sin(theta);
                } else {
                    srcX = x;
                    srcY = y;
                }

                // Clamp to valid range
                srcX = Math.max(0, Math.min(width - 1, Math.floor(srcX)));
                srcY = Math.max(0, Math.min(height - 1, Math.floor(srcY)));

                const destIndex = (y * width + x) * 4;
                const srcIndex = (srcY * width + srcX) * 4;

                destData.data[destIndex] = sourceData.data[srcIndex];
                destData.data[destIndex + 1] = sourceData.data[srcIndex + 1];
                destData.data[destIndex + 2] = sourceData.data[srcIndex + 2];
                destData.data[destIndex + 3] = sourceData.data[srcIndex + 3];
            }
        }
    }, []);

    // Render distorted camera feed continuously
    const renderFrame = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const outputCanvas = outputCanvasRef.current;

        if (!video || !canvas || !outputCanvas || video.paused || video.ended) {
            animationRef.current = requestAnimationFrame(renderFrame);
            return;
        }

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const outputCtx = outputCanvas.getContext('2d', { willReadFrequently: true });

        if (!ctx || !outputCtx) {
            animationRef.current = requestAnimationFrame(renderFrame);
            return;
        }

        // Clear canvas
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        outputCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Calculate video dimensions to cover canvas
        const videoAspect = video.videoWidth / video.videoHeight;
        const canvasAspect = CANVAS_WIDTH / CANVAS_HEIGHT;

        let drawWidth, drawHeight, drawX, drawY;

        if (videoAspect > canvasAspect) {
            // Video is wider - fit by height
            drawHeight = CANVAS_HEIGHT;
            drawWidth = CANVAS_HEIGHT * videoAspect;
            drawX = -(drawWidth - CANVAS_WIDTH) / 2;
            drawY = 0;
        } else {
            // Video is taller - fit by width
            drawWidth = CANVAS_WIDTH;
            drawHeight = CANVAS_WIDTH / videoAspect;
            drawX = 0;
            drawY = -(drawHeight - CANVAS_HEIGHT) / 2;
        }

        // Draw video to canvas (flipped horizontally for mirror effect)
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -drawX - drawWidth, drawY, drawWidth, drawHeight);
        ctx.restore();

        // Get the camera image data
        const sourceData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        const destData = outputCtx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);

        // Apply fisheye distortion
        applyFisheyeDistortion(sourceData, destData, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Put distorted image
        outputCtx.putImageData(destData, 0, 0);

        // Add chrome/metallic overlay effect
        outputCtx.globalCompositeOperation = 'overlay';
        const gradient = outputCtx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(0.3, 'rgba(180, 180, 180, 0.1)');
        gradient.addColorStop(0.7, 'rgba(200, 200, 200, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.4)');
        outputCtx.fillStyle = gradient;
        outputCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Apply text mask - keep only pixels inside the text
        outputCtx.globalCompositeOperation = 'destination-in';
        outputCtx.font = '900 180px system-ui, -apple-system, sans-serif';
        outputCtx.textAlign = 'center';
        outputCtx.textBaseline = 'middle';
        outputCtx.fillStyle = 'white';
        outputCtx.fillText('rizaldap.id', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

        // Draw text outline/stroke for depth effect
        outputCtx.globalCompositeOperation = 'source-over';
        outputCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        outputCtx.lineWidth = 2;
        outputCtx.strokeText('rizaldap.id', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

        animationRef.current = requestAnimationFrame(renderFrame);
    }, [applyFisheyeDistortion]);

    // Initialize camera
    useEffect(() => {
        let stream: MediaStream | null = null;

        const initCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'user',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();

                    // Set canvas sizes
                    const canvas = canvasRef.current;
                    const outputCanvas = outputCanvasRef.current;
                    if (canvas && outputCanvas) {
                        canvas.width = CANVAS_WIDTH;
                        canvas.height = CANVAS_HEIGHT;
                        outputCanvas.width = CANVAS_WIDTH;
                        outputCanvas.height = CANVAS_HEIGHT;
                    }

                    setHasPermission(true);
                    setIsLoading(false);

                    // Start rendering
                    animationRef.current = requestAnimationFrame(renderFrame);
                }
            } catch (error) {
                console.error('Camera access error:', error);
                setHasPermission(false);
                setIsLoading(false);
            }
        };

        initCamera();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [renderFrame]);

    return (
        <main className="min-h-screen bg-black flex items-center justify-center overflow-hidden relative" suppressHydrationWarning>
            {/* Ambient glow background */}
            <div className="absolute inset-0 bg-gradient-radial from-gray-900/50 via-black to-black" />

            {/* Grid pattern */}
            <div className="absolute inset-0 grid-bg opacity-30" />

            {/* Hidden video and processing canvas */}
            <video
                ref={videoRef}
                className="hidden"
                playsInline
                muted
                autoPlay
            />
            <canvas ref={canvasRef} className="hidden" width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center gap-8">
                {isLoading && (
                    <div className="text-white/60 text-lg animate-pulse">
                        Requesting camera access...
                    </div>
                )}

                {hasPermission === false && (
                    <div className="text-center">
                        <p className="text-red-400 text-lg mb-2">Camera access denied</p>
                        <p className="text-white/40 text-sm">Please allow camera access to see the mirror effect</p>
                    </div>
                )}

                {hasPermission && (
                    <div className="relative">
                        <canvas
                            ref={outputCanvasRef}
                            width={CANVAS_WIDTH}
                            height={CANVAS_HEIGHT}
                            style={{
                                width: `${CANVAS_WIDTH}px`,
                                height: `${CANVAS_HEIGHT}px`,
                                filter: 'contrast(1.2) saturate(1.3) brightness(1.1)',
                            }}
                        />

                        {/* Reflection glow */}
                        <div
                            className="absolute -inset-20 blur-3xl opacity-30 pointer-events-none -z-10"
                            style={{
                                background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.15), transparent 70%)',
                            }}
                        />
                    </div>
                )}

                {/* Subtitle */}
                <p className="text-white/30 text-sm tracking-widest uppercase mt-4">
                    Mirror Effect Experiment
                </p>
                <p className="text-white/20 text-xs mt-2">
                    🔒 Kamera tidak menyimpan apapun
                </p>
            </div>

            {/* Noise overlay */}
            <div className="noise-overlay" />
        </main>
    );
}
