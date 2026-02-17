import { useRef, useEffect, useCallback } from 'react';
import type { GalaxyNode } from '../hooks/useEscoGalaxy';

interface GalaxyCanvasProps {
    occupations: GalaxyNode[];
    scale: number;
    panX: number;
    panY: number;
    width: number;
    height: number;
}

export default function GalaxyCanvas({
    occupations,
    scale,
    panX,
    panY,
    width,
    height
}: GalaxyCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, width, height);

        ctx.save();
        ctx.translate(panX, panY);
        ctx.scale(scale, scale);

        // Draw Occupations as stars
        occupations.forEach(occ => {
            // Primitive culling (optional, but good for large sets)
            // Just draw small points with soft glow
            ctx.beginPath();
            ctx.arc(occ.x, occ.y, 1.2, 0, Math.PI * 2);
            ctx.fillStyle = occ.color || '#facc15';

            // Only add shadows if zoomed in for performance
            if (scale > 0.6) {
                ctx.shadowBlur = 4;
                ctx.shadowColor = occ.color || '#facc15';
            }
            ctx.fill();
        });

        ctx.restore();
    }, [occupations, scale, panX, panY, width, height]);

    useEffect(() => {
        // Use requestAnimationFrame for smoother rendering if occupations update frequently
        const raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, [draw]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="absolute inset-0 z-0 pointer-events-none"
        />
    );
}
