import React, { useRef, useEffect } from 'react';

interface CanvasGeneratorProps {
    baseImage: string;
    headline: string;
    subtext: string;
    onGenerated: (dataUrl: string) => void;
}

export const CanvasGenerator = ({ baseImage, headline, subtext, onGenerated }: CanvasGeneratorProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current || !baseImage) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = "anonymous"; // Needed for external images
        img.src = baseImage;

        img.onload = () => {
            // Draw Image
            ctx.drawImage(img, 0, 0, 1080, 1080);

            // Overlay Gradient
            const gradient = ctx.createLinearGradient(0, 540, 0, 1080);
            gradient.addColorStop(0, "rgba(0,0,0,0)");
            gradient.addColorStop(1, "rgba(0,0,0,0.8)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1080, 1080);

            // Gold Bar Accent
            ctx.fillStyle = '#D4AF37';
            ctx.fillRect(50, 50, 980, 10); // Top bar

            // Branding
            ctx.font = 'bold 30px "Inter", sans-serif';
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 10;
            ctx.fillText('D-CAPITAL DUBAI', 50, 100);

            // Headline
            ctx.font = '900 80px "Inter", sans-serif';
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            wrapText(ctx, headline.toUpperCase(), 540, 540, 900, 90);

            // Subtext
            ctx.font = '500 40px "Inter", sans-serif';
            ctx.fillStyle = '#D4AF37'; // Gold
            ctx.fillText(subtext, 540, 950);

            // Export
            try {
                const dataUrl = canvas.toDataURL('image/png');
                onGenerated(dataUrl);
            } catch (e) {
                console.error("Canvas Security Error (CORS):", e);
            }
        };

    }, [baseImage, headline, subtext]);

    // Helper to wrap text
    function wrapText(ctx: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
        const words = text.split(' ');
        let line = '';
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
    }

    return (
        <div className="hidden">
            <canvas ref={canvasRef} width={1080} height={1080} />
        </div>
    );
};
