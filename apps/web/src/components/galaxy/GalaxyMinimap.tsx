import { useEffect, useRef } from 'react';
import type { GalaxyData } from './galaxyTypes';
import { W, H } from './galaxyLayout';

interface GalaxyMinimapProps {
  data: GalaxyData | null;
  panX: number;
  panY: number;
  containerWidth: number;
  containerHeight: number;
}

const MW = 180;
const MH = 120;

export function GalaxyMinimap({
  data,
  panX,
  panY,
  containerWidth,
  containerHeight,
}: GalaxyMinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, MW, MH);

    const sx = MW / W;
    const sy = MH / H;

    // Draw category dots
    for (const cat of data.categories) {
      ctx.beginPath();
      ctx.arc(cat.x * sx, cat.y * sy, 4, 0, Math.PI * 2);
      ctx.fillStyle = cat.color + '60';
      ctx.fill();

      // Draw job dots
      for (const job of cat.jobs) {
        ctx.beginPath();
        ctx.arc(job.x * sx, job.y * sy, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = cat.color + '30';
        ctx.fill();
      }
    }

    // Draw viewport rectangle (no scale — 1:1 world)
    if (containerWidth > 0 && containerHeight > 0) {
      const vx = -panX * sx;
      const vy = -panY * sy;

      ctx.strokeStyle = 'rgba(56,189,248,0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(vx, vy, containerWidth * sx, containerHeight * sy);
    }
  }, [data, panX, panY, containerWidth, containerHeight]);

  return (
    <div className="absolute bottom-4 right-4 z-40 overflow-hidden rounded-lg border border-slate-700 bg-slate-800/90">
      <canvas ref={canvasRef} width={MW} height={MH} />
    </div>
  );
}
