import { Orbit, Search, PanelLeft } from 'lucide-react';
import type { GalaxyNode } from '../hooks/useEscoGalaxy';

interface GalaxySidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    groups: GalaxyNode[];
    visibleGroups: GalaxyNode[];
    visibleOccupations: GalaxyNode[];
    allOccupationsCount: number;
    loading: boolean;
    onFocusGroup: (id: string) => void;
    onFocusOccupation: (node: GalaxyNode) => void;
}

export default function GalaxySidebar({
    sidebarOpen,
    setSidebarOpen,
    searchQuery,
    setSearchQuery,
    groups,
    visibleGroups,
    visibleOccupations,
    allOccupationsCount,
    loading,
    onFocusGroup,
    onFocusOccupation
}: GalaxySidebarProps) {

    return (
        <aside className={`border-r border-slate-800 bg-[#0B1120]/80 backdrop-blur-xl flex flex-col z-30 shrink-0 transition-all duration-300 ease-in-out relative ${sidebarOpen ? 'w-64' : 'w-0 border-r-0'}`}>
            {sidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center hover:text-white z-40 shadow-lg"
                >
                    <PanelLeft className="w-3.5 h-3.5 rotate-180" />
                </button>
            )}

            <div className={`flex flex-col h-full overflow-hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                {/* Header */}
                <div className="h-12 flex items-center px-4 border-b border-slate-800/50">
                    <Orbit className="w-4 h-4 text-sky-500 mr-2" />
                    <span className="text-slate-200 font-bold text-sm whitespace-nowrap">ESCO Galaxy</span>
                </div>

                {/* Content */}
                <nav className="flex-1 overflow-y-auto px-3 pt-3 space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="ค้นหา..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 transition-colors"
                        />
                    </div>

                    {/* Major Groups List */}
                    <div>
                        <h3 className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">Structure ({groups.length})</h3>
                        <ul className="space-y-1 max-h-[240px] overflow-y-auto pr-1">
                            {groups.filter(g => g.level === 1).map(g => (
                                <li key={g.id} onClick={() => onFocusGroup(g.id)} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-all group">
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: g.color || '#38bdf8' }} />
                                    <span className="text-[11px] text-slate-300 flex-1 truncate group-hover:text-white">{g.prefLabel}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Occupations List (Visibles only) */}
                    {visibleOccupations.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">Occupations ({visibleOccupations.length})</h3>
                            <ul className="space-y-1 max-h-[240px] overflow-y-auto pr-1">
                                {visibleOccupations.slice(0, 50).map(occ => (
                                    <li key={occ.id} onClick={() => onFocusOccupation(occ)} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-all group">
                                        <div className="w-2.5 h-2.5 rounded-full flex items-center justify-center border border-white/20 shrink-0" style={{ borderColor: occ.color }}>
                                            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: occ.color }} />
                                        </div>
                                        <span className="text-[11px] text-slate-300 flex-1 truncate group-hover:text-white" title={occ.prefLabel}>{occ.prefLabel}</span>
                                    </li>
                                ))}
                                {visibleOccupations.length > 50 && (
                                    <li className="text-[10px] text-slate-500 text-center py-1">
                                        + {visibleOccupations.length - 50} more
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="px-1 space-y-1.5 border-t border-slate-800/50 pt-2 mt-2">
                        <div className="flex justify-between text-[11px]"><span className="text-slate-500">Major Groups</span><span className="text-slate-200 font-bold">{groups.filter(g => g.level === 1).length}</span></div>
                        <div className="flex justify-between text-[11px]"><span className="text-slate-500">Visible Groups</span><span className="text-sky-400 font-bold">{visibleGroups.length}</span> / {groups.length}</div>
                        <div className="flex justify-between text-[11px]"><span className="text-slate-500">Visible Occupations</span><span className="text-emerald-400 font-bold">{visibleOccupations.length}</span> / {allOccupationsCount}</div>
                    </div>

                    {loading && (
                        <div className="px-2 py-4 text-center">
                            <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-[10px] text-slate-500 italic">Expanding Universe...</p>
                        </div>
                    )}
                </nav>
            </div>
        </aside>
    );
}
