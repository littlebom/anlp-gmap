import { useRef, useEffect } from 'react';
import type { GalaxyNode } from '../hooks/useEscoGalaxy';

interface MinimapProps {
    groups: GalaxyNode[];
    panX: number;
    panY: number;
    scale: number;
    viewportWidth: number;
    viewportHeight: number;
    worldWidth: number;
    worldHeight: number;
}

export default function Minimap({
    groups,
    panX,
    panY,
    scale,
    viewportWidth,
    viewportHeight,
    worldWidth,
    worldHeight
}: MinimapProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Dimensions
        const mapW = canvas.width;
        const mapH = canvas.height;
        const scaleX = mapW / worldWidth;
        const scaleY = mapH / worldHeight;
        const s = Math.min(scaleX, scaleY); // Keep aspect ratio

        // Clear
        ctx.clearRect(0, 0, mapW, mapH);

        // Draw groups as dots
        groups.forEach(g => {
            if (g.level !== 1) return; // Only show L1 groups
            ctx.beginPath();
            ctx.arc(g.x * s, g.y * s, 3, 0, Math.PI * 2);
            ctx.fillStyle = (g.color || '#38bdf8') + '80'; // 50% opacity
            ctx.fill();
        });

        // Draw Viewport Rect
        // Transform current view to minimap coords
        // The view "window" in world coords:
        // x = -panX / scale
        // y = -panY / scale
        // w = viewportWidth / scale
        // h = viewportHeight / scale

        const vx = (-panX / scale) * s;
        const vy = (-panY / scale) * s;
        const vw = (viewportWidth / scale) * s;
        const vh = (viewportHeight / scale) * s;

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(vx, vy, vw, vh);

    }, [groups, panX, panY, scale, viewportWidth, viewportHeight, worldWidth, worldHeight]);

    return (
        <div className="absolute bottom-4 right-4 w-36 h-24 rounded-lg bg-slate-800/90 border border-slate-700 z-40 overflow-hidden shadow-lg">
            <canvas
                ref={canvasRef}
                width={144}
                height={96}
                className="w-full h-full"
            />
        </div>
    );
}
