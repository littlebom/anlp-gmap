import { Plus, Minus, RotateCcw } from 'lucide-react';

interface GalaxyControlsProps {
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
}

export default function GalaxyControls({ onZoomIn, onZoomOut, onReset }: GalaxyControlsProps) {
    return (
        <div className="absolute bottom-4 left-4 flex flex-col gap-1 z-40">
            <button onClick={onZoomIn} className="w-7 h-7 rounded bg-slate-800/90 border border-slate-700 text-slate-300 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-all font-bold">
                <Plus className="w-3.5 h-3.5" />
            </button>
            <button onClick={onZoomOut} className="w-7 h-7 rounded bg-slate-800/90 border border-slate-700 text-slate-300 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-all font-bold">
                <Minus className="w-3.5 h-3.5" />
            </button>
            <button onClick={onReset} className="w-7 h-7 rounded bg-slate-800/90 border border-slate-700 text-slate-300 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-all" title="Reset View">
                <RotateCcw className="w-3 h-3" />
            </button>
        </div>
    );
}
