import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useEscoGalaxy } from '../hooks/useEscoGalaxy';
import type { GalaxyNode } from '../hooks/useEscoGalaxy';
import Minimap from '../components/Minimap';
import {
    Orbit, Maximize, Minimize, RotateCcw, Plus, Minus,
    PanelLeft, Search,
    Brain, GraduationCap, Code, ClipboardList, PenTool, Cloud, Settings as SettingsIcon, Shield
} from 'lucide-react';

const MIN_SCALE = 0.05;
const MAX_SCALE = 2.0;
const INIT_SCALE = 0.3;
const WORLD_W = 8000;
const WORLD_H = 6000;
const VIEWPORT_BUFFER = 400; // Load nodes 400px outside the viewport

const ICON_MAP: Record<string, any> = {
    'brain': Brain,
    'graduation-cap': GraduationCap,
    'code': Code,
    'clipboard-list': ClipboardList,
    'pen-tool': PenTool,
    'cloud': Cloud,
    'settings': SettingsIcon,
    'shield': Shield,
    'orbit': Orbit
};

function Tooltip({ x, y, title, desc, visible }: { x: number; y: number; title: string; desc: string; visible: boolean }) {
    if (!visible) return null;
    return (
        <div
            className="fixed z-[100] px-3.5 py-2.5 rounded-xl border border-slate-700 pointer-events-none"
            style={{
                left: x + 12, top: y - 10,
                background: 'rgba(15,23,42,0.95)',
                backdropFilter: 'blur(8px)',
                maxWidth: 240,
            }}
        >
            <p className="text-xs text-slate-200 font-semibold">{title}</p>
            <p className="text-[10px] text-slate-400 mt-1">{desc}</p>
        </div>
    );
}

export default function GalaxyViewPage() {
    // const { user, logout } = useAuthStore(); // Unused
    const { groups, occupations, loading } = useEscoGalaxy();

    const [scale, setScale] = useState(INIT_SCALE);
    const [panX, setPanX] = useState(0);
    const [panY, setPanY] = useState(0);

    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const [breadcrumb, setBreadcrumb] = useState('ES Universe');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [viewportSize, setViewportSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    const [searchQuery, setSearchQuery] = useState('');
    const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);
    const [tooltip, setTooltip] = useState({ x: 0, y: 0, title: '', desc: '', visible: false });
    const galaxyRef = useRef<HTMLDivElement>(null);

    // Dynamic Sizing Logic for Major Groups
    const l1Stats = useMemo(() => {
        const counts: Record<string, number> = {};

        // Initialize counts for L1 groups
        groups.filter(g => g.level === 1).forEach(g => {
            counts[g.id] = 0;
        });

        // Count all descendants (groups + occupations)
        // Note: rootId is now available on all nodes
        [...groups, ...occupations].forEach(node => {
            const root = node.rootId || (node.level === 1 ? node.id : null);
            if (root && counts[root] !== undefined) {
                counts[root]++;
            }
        });

        const values = Object.values(counts);
        const min = Math.min(...values);
        const max = Math.max(...values);

        return { counts, min, max };
    }, [groups, occupations]);

    const getL1Size = (group: GalaxyNode) => {
        const count = l1Stats.counts[group.id] || 0;
        const { min, max } = l1Stats;
        if (max === min) return 45;
        // Normalize 0-1
        const t = (count - min) / (max - min);
        // Map to 45px - 100px
        return 45 + (t * 55);
    };

    // Semantic Highlighting Logic
    const nodeL2Map = useMemo(() => {
        const l2Map = new Map<string, string | null>();
        const pool = new Map<string, GalaxyNode>();
        [...groups, ...occupations].forEach(n => pool.set(n.id, n));

        const findL2 = (n: GalaxyNode): string | null => {
            let curr: any = n;
            const visited = new Set();
            while (curr && !visited.has(curr.id)) {
                visited.add(curr.id);
                if (curr.level === 2) return curr.id;
                if (!curr.parentId) break;
                curr = pool.get(curr.parentId);
            }
            return null;
        };

        [...groups, ...occupations].forEach(n => {
            l2Map.set(n.id, findL2(n));
        });
        return l2Map;
    }, [groups, occupations]);

    const isNodeDimmed = useCallback((node: GalaxyNode) => {
        if (!hoveredGroupId) return false;
        const l2Id = nodeL2Map.get(node.id);
        // Highlight if it's the specific L2, or shares the L2 cluster, or is an L1 parent of this cluster
        if (node.id === hoveredGroupId) return false;
        if (l2Id === hoveredGroupId) return false;
        // Special case: if node is L1 parent of the hovered L2
        if (node.level === 1) {
            const hoveredNode = groups.find(g => g.id === hoveredGroupId);
            if (hoveredNode && hoveredNode.rootId === node.id) return false;
        }
        return true;
    }, [hoveredGroupId, nodeL2Map, groups]);

    // Viewport Culling State
    const [visibleGroups, setVisibleGroups] = useState<GalaxyNode[]>([]);
    const [visibleOccupations, setVisibleOccupations] = useState<GalaxyNode[]>([]);

    useEffect(() => {
        const updateSize = () => {
            const newSize = { width: window.innerWidth, height: window.innerHeight };
            setViewportSize(newSize);
        };
        window.addEventListener('resize', updateSize);
        // Initial center
        const centerX = window.innerWidth / 2 - (WORLD_W / 2 * INIT_SCALE);
        const centerY = window.innerHeight / 2 - (WORLD_H / 2 * INIT_SCALE);
        setPanX(centerX);
        setPanY(centerY);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Culling Logic
    // Run whenever pan/scale/groups change
    useEffect(() => {
        if (loading || groups.length === 0) return;

        // Calculate world boundaries of current viewport
        // Viewport (Screen) is 0,0 to W,H
        // Transform: screenX = worldX * scale + panX
        // Inverse: worldX = (screenX - panX) / scale

        const startX = (-panX - VIEWPORT_BUFFER) / scale;
        const startY = (-panY - VIEWPORT_BUFFER) / scale;
        const endX = (viewportSize.width - panX + VIEWPORT_BUFFER) / scale;
        const endY = (viewportSize.height - panY + VIEWPORT_BUFFER) / scale;

        // Filter groups within these bounds
        const visible = groups.filter(g => {
            // Always show Level 1 for context, or if in bounds
            if (g.level === 1) return true;
            return g.x >= startX && g.x <= endX && g.y >= startY && g.y <= endY;
        });

        setVisibleGroups(visible);

        // Filter occupations within bounds
        // Only show occupations if scale > 0.5 (LOD)
        if (scale > 0.5) {
            const visibleO = occupations.filter(o =>
                o.x >= startX && o.x <= endX && o.y >= startY && o.y <= endY
            );
            // Limit total visible occupations to prevent DOM overload
            setVisibleOccupations(visibleO.slice(0, 500));
        } else {
            setVisibleOccupations([]);
        }

    }, [groups, occupations, panX, panY, scale, viewportSize, loading]);


    const pct = scale * 100;
    const clusterOpacity = pct > 200 ? 0.3 : 1;

    // Search Filtering (applied on top of Viewport Culling)
    const isNodeVisible = (node: GalaxyNode) => {
        if (!searchQuery) return true;
        return node.prefLabel.toLowerCase().includes(searchQuery.toLowerCase());
    };

    const doZoom = useCallback((delta: number, cx?: number, cy?: number) => {
        setScale((prev) => {
            const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev + delta));
            const pointX = cx ?? window.innerWidth / 2;
            const pointY = cy ?? window.innerHeight / 2;
            if (pointX !== undefined && pointY !== undefined) {
                const worldX = (pointX - panX) / prev;
                const worldY = (pointY - panY) / prev;
                setPanX(pointX - worldX * next);
                setPanY(pointY - worldY * next);
            }
            return next;
        });
    }, [panX, panY]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.04 : 0.04;
        const rect = galaxyRef.current?.getBoundingClientRect();
        if (rect) {
            doZoom(delta, e.clientX - rect.left, e.clientY - rect.top);
        }
    }, [doZoom]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        setIsDragging(true);
        dragStart.current = { x: e.clientX - panX, y: e.clientY - panY };
    }, [panX, panY]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDragging) {
            setPanX(e.clientX - dragStart.current.x);
            setPanY(e.clientY - dragStart.current.y);
        }
    }, [isDragging]);

    const handleMouseUp = useCallback(() => setIsDragging(false), []);


    const resetView = useCallback(() => {
        setScale(INIT_SCALE);
        const centerX = window.innerWidth / 2 - (WORLD_W / 2 * INIT_SCALE);
        const centerY = window.innerHeight / 2 - (WORLD_H / 2 * INIT_SCALE);
        setPanX(centerX);
        setPanY(centerY);
        setBreadcrumb('ES Universe');
        setSearchQuery('');
    }, []);

    const handleNodeClick = (node: GalaxyNode) => {
        if (node.type === 'occupation') {
            window.open(`/occupation-network/${node.id}`, '_blank');
        } else {
            setBreadcrumb(node.prefLabel);
            const nextScale = 1.2;
            setScale(nextScale);
            setPanX(window.innerWidth / 2 - node.x * nextScale);
            setPanY(window.innerHeight / 2 - node.y * nextScale);
        }
    };

    const focusGroup = (id: string) => {
        const group = groups.find(g => g.id === id);
        if (group) handleNodeClick(group);
    };

    const showTooltip = (e: React.MouseEvent, title: string, desc: string) => {
        setTooltip({ x: e.clientX, y: e.clientY, title, desc, visible: true });
    };
    const hideTooltip = () => setTooltip((t) => ({ ...t, visible: false }));

    const stars = useMemo(() => Array.from({ length: 150 }, () => ({
        x: Math.random() * WORLD_W,
        y: Math.random() * WORLD_H,
        r: 0.5 + Math.random() * 1.5,
        delay: Math.random() * 5,
    })), []);

    return (
        <div className="galaxy-root flex h-screen overflow-hidden bg-[#0B1120]">
            {/* Sidebar (Left Overlay) */}
            <aside className={`fixed top-14 bottom-4 left-4 w-72 rounded-3xl border border-slate-700/50 bg-[#0B1120]/60 backdrop-blur-2xl flex flex-col z-50 transition-all duration-500 ease-in-out shadow-2xl ${sidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-[calc(100%+20px)] opacity-0 pointer-events-none'}`}>
                <div className="h-14 flex items-center justify-between px-5 border-b border-slate-800/30">
                    <div className="flex items-center">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center mr-3 shadow-lg shadow-sky-500/20">
                            <Orbit className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-slate-200 font-bold text-sm tracking-tight text-white">ESCO Galaxy</span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-slate-500 hover:text-white">
                        <PanelLeft className="w-4 h-4" />
                    </button>
                </div>
                {/* ... Navigation ... */}
                <nav className="flex-1 overflow-y-auto px-3 pt-3 space-y-4">
                    {/* ... Search ... */}
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input type="text" placeholder="ค้นหา..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 transition-colors" />
                    </div>
                    {/* ... Groups List ... */}
                    <div>
                        <h3 className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">Structure ({groups.length})</h3>
                        <ul className="space-y-1 max-h-[240px] overflow-y-auto pr-1">
                            {groups.filter(g => g.level === 1).map(g => (
                                <li key={g.id} onClick={() => focusGroup(g.id)} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-all group">
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: g.color || '#38bdf8' }} />
                                    <span className="text-[11px] text-slate-300 flex-1 truncate group-hover:text-white">{g.prefLabel}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {visibleOccupations.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">Occupations ({visibleOccupations.length})</h3>
                            <ul className="space-y-1 max-h-[240px] overflow-y-auto pr-1">
                                {visibleOccupations.slice(0, 50).map(occ => (
                                    <li key={occ.id} onClick={() => handleNodeClick(occ)} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-all group">
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

                    <div className="px-1 space-y-1.5 border-t border-slate-800/50 pt-2 mt-2">
                        <div className="flex justify-between text-[11px]"><span className="text-slate-500">Major Groups</span><span className="text-slate-200 font-bold">{groups.filter(g => g.level === 1).length}</span></div>
                        <div className="flex justify-between text-[11px]"><span className="text-slate-500">Visible Groups</span><span className="text-sky-400 font-bold">{visibleGroups.length}</span> / {groups.length}</div>
                        <div className="flex justify-between text-[11px]"><span className="text-slate-500">Visible Occupations</span><span className="text-emerald-400 font-bold">{visibleOccupations.length}</span> / {occupations.length}</div>
                    </div>
                    {loading && (
                        <div className="px-2 py-4 text-center">
                            <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-[10px] text-slate-500 italic">Expanding Universe...</p>
                        </div>
                    )}
                </nav>
            </aside>

            <main className="flex-1 relative z-10 flex flex-col overflow-hidden w-full">
                {!sidebarOpen && (
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="absolute left-6 top-6 w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center z-40 hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20 scale-in"
                    >
                        <Search className="w-5 h-5" />
                    </button>
                )}
                <div className="fixed inset-0 bg-grid pointer-events-none z-0 opacity-20" />
                <div ref={galaxyRef} className={`absolute inset-0 overflow-hidden ${isFullscreen ? 'fixed z-[9999]' : ''}`} style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }} onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                    <div className="absolute" style={{ transformOrigin: '0 0', transform: `translate(${panX}px, ${panY}px) scale(${scale})` }}>
                        <svg className="absolute inset-0 pointer-events-none overflow-visible" width={WORLD_W} height={WORLD_H}>
                            {stars.map((s, i) => (
                                <circle key={`b-star-${i}`} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={0.15} style={{ animation: `twinkle 3s ease-in-out ${s.delay}s infinite` }} />
                            ))}
                            {/* Render lines only for visible groups to save performance */}
                            {visibleGroups.map(g => {
                                if (g.parentId) {
                                    const parent = groups.find(p => p.id === g.parentId);
                                    if (parent) {
                                        const isDimmed = isNodeDimmed(g);
                                        const strokeOpacity = hoveredGroupId ? (isDimmed ? 0.01 : 0.8) : 0.3;
                                        return (
                                            <line
                                                key={`parent-line-${g.id}`}
                                                className="transition-all duration-500"
                                                x1={parent.x} y1={parent.y}
                                                x2={g.x} y2={g.y}
                                                stroke={g.color}
                                                strokeOpacity={strokeOpacity}
                                                strokeWidth={g.level === 4 ? 0.5 : 1}
                                                strokeDasharray="2 2"
                                            />
                                        );
                                    }
                                }
                                return null;
                            })}

                            {/* Render lines for occupations */}
                            {scale > 0.4 && visibleOccupations.map(occ => {
                                if (occ.parentId) {
                                    const parent = groups.find(p => p.id === occ.parentId);
                                    if (parent) {
                                        const isDimmed = isNodeDimmed(occ);
                                        const strokeOpacity = hoveredGroupId ? (isDimmed ? 0.01 : 0.4) : 0.15;
                                        return (
                                            <line
                                                key={`occ-line-${occ.id}`}
                                                className="transition-all duration-500"
                                                x1={parent.x} y1={parent.y}
                                                x2={occ.x} y2={occ.y}
                                                stroke={occ.color}
                                                strokeOpacity={strokeOpacity}
                                                strokeWidth={0.5}
                                                strokeDasharray="1 3"
                                            />
                                        );
                                    }
                                }
                                return null;
                            })}

                        </svg>

                        {visibleGroups.map((group) => {
                            const IconComp = ICON_MAP[group.icon || 'orbit'] || Orbit;

                            let size = 32;
                            let tooltipInfo = `ISCO L${group.level} | ${group.code}`;

                            if (group.level === 1) {
                                size = getL1Size(group);
                                const count = l1Stats.counts[group.id] || 0;
                                tooltipInfo += ` | ${count} Nodes`;
                            }
                            else if (group.level === 2) size = 42;
                            else if (group.level === 3) size = 32;
                            else if (group.level === 4) size = 24;

                            const visible = isNodeVisible(group);
                            const showLabel = scale > 0.5 || group.level === 1;

                            const isDimmed = isNodeDimmed(group);
                            const baseOpacity = visible ? clusterOpacity : 0.1;
                            const opacity = hoveredGroupId ? (isDimmed ? 0.05 : 1) : baseOpacity;

                            return (
                                <div
                                    key={`group-${group.id}`}
                                    id={`group-${group.id}`}
                                    className="absolute flex flex-col items-center cursor-pointer transition-all duration-500 ease-out"
                                    style={{
                                        left: group.x - size / 2,
                                        top: group.y - size / 2,
                                        width: size,
                                        opacity,
                                        filter: isDimmed ? 'grayscale(100%)' : (visible ? 'none' : 'grayscale(100%)'),
                                        zIndex: isDimmed ? 5 : (10 - (group.level || 0)),
                                        transform: isDimmed ? 'scale(0.9)' : (hoveredGroupId ? 'scale(1.1)' : 'scale(1)')
                                    }}
                                    onClick={() => handleNodeClick(group)}
                                    onMouseEnter={(e) => {
                                        showTooltip(e, group.prefLabel, tooltipInfo);
                                        const l2Id = nodeL2Map.get(group.id);
                                        if (l2Id) setHoveredGroupId(l2Id);
                                        else if (group.level === 1) setHoveredGroupId(group.id); // Maybe highlight L1 tree? 
                                    }}
                                    onMouseLeave={() => {
                                        hideTooltip();
                                        setHoveredGroupId(null);
                                    }}
                                >
                                    <div
                                        className="rounded-full flex items-center justify-center transition-all hover:scale-110 relative"
                                        style={{
                                            width: size,
                                            height: size,
                                            background: `linear-gradient(135deg, ${group.color}30, ${group.color}10)`,
                                            border: `1px solid ${group.color}60`,
                                            boxShadow: `0 0 15px ${group.color}20`,
                                            backdropFilter: 'blur(4px)',
                                        }}
                                    >
                                        <IconComp className={group.level === 1 ? 'w-1/2 h-1/2' : 'w-3 h-3'} style={{ color: group.color }} />

                                        {/* Dynamic Orbit Ring for Level 1 */}
                                        {group.level === 1 && (
                                            <div
                                                className="absolute -inset-2 border border-dashed rounded-full animate-spin-slow opacity-20"
                                                style={{ borderColor: group.color }}
                                            />
                                        )}
                                    </div>
                                    <div
                                        className="absolute top-full mt-1 flex flex-col items-center pointer-events-none"
                                        style={{
                                            transform: `scale(${1 / scale})`,
                                            transformOrigin: 'top center'
                                        }}
                                    >
                                        {showLabel && (
                                            <span
                                                className="font-bold text-center leading-tight whitespace-nowrap text-[11px] px-1 truncate max-w-[140px]"
                                                style={{
                                                    color: group.color,
                                                    textShadow: '0 0 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)'
                                                }}
                                            >
                                                {group.prefLabel}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Render Occupations */}
                        {visibleOccupations.map((occ) => {
                            const size = 14;
                            const visible = isNodeVisible(occ);

                            const isDimmed = isNodeDimmed(occ);
                            const opacity = hoveredGroupId ? (isDimmed ? 0.05 : 1) : (visible ? 0.9 : 0.1);

                            return (
                                <div
                                    key={`occ-${occ.id}`}
                                    className="absolute flex flex-col items-center cursor-pointer transition-all duration-300"
                                    style={{
                                        left: occ.x - size / 2,
                                        top: occ.y - size / 2,
                                        width: size,
                                        opacity,
                                        filter: isDimmed ? 'grayscale(100%)' : 'none',
                                        zIndex: isDimmed ? 2 : 5,
                                        transform: isDimmed ? 'scale(0.85)' : (hoveredGroupId ? 'scale(1.1)' : 'scale(1)')
                                    }}
                                    onClick={(e) => { e.stopPropagation(); handleNodeClick(occ); }}
                                    onMouseEnter={(e) => {
                                        showTooltip(e, occ.prefLabel, `Occupation`);
                                        const l2Id = nodeL2Map.get(occ.id);
                                        if (l2Id) setHoveredGroupId(l2Id);
                                    }}
                                    onMouseLeave={() => {
                                        hideTooltip();
                                        setHoveredGroupId(null);
                                    }}
                                >
                                    <div
                                        className="rounded-full flex items-center justify-center border hover:scale-125 transition-all bg-[#0B1120]/80"
                                        style={{
                                            width: size,
                                            height: size,
                                            borderColor: `${occ.color}80`,
                                            boxShadow: `0 0 8px ${occ.color}30`,
                                        }}
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: occ.color }} />
                                    </div>
                                    {scale > 0.8 && (
                                        <div
                                            className="absolute top-full mt-1 flex flex-col items-center pointer-events-none"
                                            style={{
                                                transform: `scale(${1 / scale})`,
                                                transformOrigin: 'top center'
                                            }}
                                        >
                                            <span
                                                className="font-semibold text-center leading-tight whitespace-nowrap text-[9px] px-1 truncate max-w-[120px]"
                                                style={{
                                                    color: occ.color,
                                                    textShadow: '0 0 3px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.6)'
                                                }}
                                            >
                                                {occ.prefLabel}
                                            </span>
                                        </div>
                                    )}

                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-5 z-40 bg-gradient-to-b from-[#0B1120] to-transparent pointer-events-none">
                    <div className={`transition-all duration-500 pl-4 ${!sidebarOpen ? 'ml-12' : 'ml-72 opacity-0'}`}>
                        <h1 className="text-sm font-bold text-slate-200 tracking-tight">Galaxy View</h1>
                        <p className="text-[10px] text-slate-500 max-w-[300px] truncate">{breadcrumb}</p>
                    </div>
                    <div className="flex items-center gap-2 pointer-events-auto">
                        <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-[10px] text-slate-400 font-mono">{Math.round(pct)}%</span>
                        <button onClick={() => setIsFullscreen(!isFullscreen)} className="w-7 h-7 rounded bg-slate-800/80 border border-slate-700 text-slate-400 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-all">
                            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                </div>

                <div className="absolute bottom-4 left-4 flex flex-col gap-1 z-40">
                    <button onClick={() => doZoom(0.08)} className="w-7 h-7 rounded bg-slate-800/90 border border-slate-700 text-slate-300 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-all font-bold"><Plus className="w-3.5 h-3.5" /></button>
                    <button onClick={() => doZoom(-0.08)} className="w-7 h-7 rounded bg-slate-800/90 border border-slate-700 text-slate-300 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-all font-bold"><Minus className="w-3.5 h-3.5" /></button>
                    <button onClick={resetView} className="w-7 h-7 rounded bg-slate-800/90 border border-slate-700 text-slate-300 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-all" title="Reset View"><RotateCcw className="w-3 h-3" /></button>
                </div>

                <Minimap groups={groups} panX={panX} panY={panY} scale={scale} viewportWidth={viewportSize.width} viewportHeight={viewportSize.height} worldWidth={WORLD_W} worldHeight={WORLD_H} />
            </main>
            <Tooltip {...tooltip} />
        </div >
    );
}
