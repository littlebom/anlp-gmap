export interface TooltipData {
  title: string;
  description: string;
  x: number;
  y: number;
}

export function GalaxyTooltip({ data }: { data: TooltipData | null }) {
  if (!data) return null;

  return (
    <div
      className="pointer-events-none fixed z-[100] max-w-[240px] rounded-[10px] border border-slate-700 bg-slate-900/95 px-3.5 py-2.5 backdrop-blur-lg"
      style={{
        left: data.x + 12,
        top: data.y - 10,
      }}
    >
      <p className="text-xs font-semibold text-slate-200">{data.title}</p>
      <p className="mt-1 text-[10px] text-slate-400">{data.description}</p>
    </div>
  );
}
