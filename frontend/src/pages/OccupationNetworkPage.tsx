import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, Brain, Briefcase, Code, ChevronRight,
    RotateCcw, Search, Share2, Info,
    Lock, Microscope, Zap, Database, Server, Shield, Cloud,
    Terminal, Layout, Activity,
    Cpu, Code2, Globe2, Layers, Settings, Wrench, Hammer
} from 'lucide-react';

const API_BASE = 'http://localhost:3000';

interface NetworkNode {
    id: string;
    label: string;
    type: 'occupation' | 'skill' | 'neighbor';
    color: string;
    x?: number;
    y?: number;
    desc?: string;
}

interface NetworkLink {
    source: string;
    target: string;
    type: string;
}

const WORLD_WIDTH = 3600;
const WORLD_HEIGHT = 2800;
const CX = WORLD_WIDTH / 2;
const CY = WORLD_HEIGHT / 2;

const getNodeIcon = (label: string, type: string) => {
    const low = label.toLowerCase();
    if (type === 'occupation' || type === 'neighbor') {
        if (low.includes('data') || low.includes('analyst') || low.includes('science')) return Database;
        if (low.includes('code') || low.includes('software') || low.includes('developer') || low.includes('engineer')) return Code2;
        if (low.includes('secure') || low.includes('shield') || low.includes('protect')) return Shield;
        if (low.includes('cloud') || low.includes('server') || low.includes('network')) return Cloud;
        if (low.includes('design') || low.includes('creative') || low.includes('ui') || low.includes('ux')) return Layout;
        if (low.includes('manage') || low.includes('lead') || low.includes('head') || low.includes('chief')) return Briefcase;
        if (low.includes('test') || low.includes('quality') || low.includes('qa')) return Zap;
        if (low.includes('web') || low.includes('internet') || low.includes('online')) return Globe2;
        if (low.includes('research') || low.includes('science') || low.includes('study')) return Microscope;
        return Briefcase;
    }

    // Skill specific icons
    if (low.includes('python') || low.includes('java') || low.includes('script') || low.includes('c++') || low.includes('code')) return Code;
    if (low.includes('sql') || low.includes('db') || low.includes('database')) return Database;
    if (low.includes('cloud') || low.includes('aws') || low.includes('azure') || low.includes('docker')) return Server;
    if (low.includes('terminal') || low.includes('shell') || low.includes('linux')) return Terminal;
    if (low.includes('brain') || low.includes('ai') || low.includes('intelligence') || low.includes('smart')) return Brain;
    if (low.includes('design') || low.includes('draw') || low.includes('style')) return Layers;
    if (low.includes('secure') || low.includes('crypt') || low.includes('privacy')) return Lock;
    if (low.includes('config') || low.includes('set') || low.includes('system')) return Settings;
    if (low.includes('hardware') || low.includes('chip') || low.includes('circuit')) return Cpu;
    if (low.includes('math') || low.includes('stat') || low.includes('calc')) return Activity;
    if (low.includes('tool') || low.includes('instrument') || low.includes('fix')) return Wrench;
    if (low.includes('build') || low.includes('construct') || low.includes('physic')) return Hammer;

    return Brain;
};

export default function OccupationNetworkPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<{ nodes: NetworkNode[], links: NetworkLink[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [scale, setScale] = useState(0.5);
    const [panX, setPanX] = useState(0);
    const [panY, setPanY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
    const [search, setSearch] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const fetchNetwork = useCallback(async (targetId: string) => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/esco/occupations/${targetId}/network`);
            const network = res.data;

            // Constellation Layout
            const nodes = network.nodes as NetworkNode[];
            const links = network.links as NetworkLink[];

            const centerNode = nodes.find(n => n.type === 'occupation');
            const skills = nodes.filter(n => n.type === 'skill');
            const neighbors = nodes.filter(n => n.type === 'neighbor');

            if (centerNode) {
                centerNode.x = CX;
                centerNode.y = CY;
            }

            // Layout Skills in Organic Orbit
            skills.forEach((s, i) => {
                const angle = (i / skills.length) * Math.PI * 2 - Math.PI / 2;
                const r = 400;
                s.x = CX + Math.cos(angle) * r;
                s.y = CY + Math.sin(angle) * r;
            });

            // Layout Neighbors around their respective skills
            neighbors.forEach((n) => {
                // Find links connecting this neighbor to a skill
                const linkToSkill = links.find(l => l.target === n.id || l.source === n.id);
                if (linkToSkill) {
                    const skillId = linkToSkill.source === n.id ? linkToSkill.target : linkToSkill.source;
                    const skillNode = skills.find(s => s.id === skillId);

                    if (skillNode && skillNode.x !== undefined && skillNode.y !== undefined) {
                        // Find other neighbors sharing the same skill to spread them
                        const siblings = neighbors.filter(neigh => {
                            const l = links.find(li => (li.target === neigh.id || li.source === neigh.id) && (li.source === skillId || li.target === skillId));
                            return !!l;
                        });
                        const idx = siblings.indexOf(n);

                        // Angle relative to skill node, pointing away from center
                        const outAngle = Math.atan2(skillNode.y - CY, skillNode.x - CX);
                        const spread = (idx / Math.max(1, siblings.length - 1) - 0.5) * Math.PI * 0.6;
                        const finalAngle = outAngle + spread;
                        const r = 180;

                        n.x = skillNode.x + Math.cos(finalAngle) * r;
                        n.y = skillNode.y + Math.sin(finalAngle) * r;
                    }
                }
            });

            setData({ nodes, links });
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch network', err);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (id) fetchNetwork(id);
    }, [id, fetchNetwork]);

    const transformStyle = {
        transform: `translate(calc(50% - ${CX * scale}px + ${panX}px), calc(50% - ${CY * scale}px + ${panY}px)) scale(${scale})`,
        transformOrigin: '0 0'
    };

    const handleWheel = (e: React.WheelEvent) => {
        const delta = e.deltaY > 0 ? -0.04 : 0.04;
        setScale(s => Math.max(0.2, Math.min(1.5, s + delta)));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        setIsDragging(true);
        dragStart.current = { x: e.clientX - panX, y: e.clientY - panY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPanX(e.clientX - dragStart.current.x);
            setPanY(e.clientY - dragStart.current.y);
        }
    };

    const handleNodeClick = (node: NetworkNode) => {
        setSelectedNode(node);
    };

    const filteredNodes = useMemo(() => {
        if (!search) return data?.nodes || [];
        const low = search.toLowerCase();
        return (data?.nodes || []).map(n => ({
            ...n,
            dimmed: !n.label?.toLowerCase().includes(low)
        }));
    }, [data, search]);

    if (loading) {
        return (
            <div className="h-screen bg-[#0B1120] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
                    <p className="text-sm font-medium animate-pulse text-sky-400">Loading Constellation...</p>
                </div>
            </div>
        );
    }

    const targetOccupation = data?.nodes.find(n => n.type === 'occupation');

    return (
        <div className="h-screen bg-[#0B1120] text-slate-400 flex overflow-hidden font-['Inter'] antialiased">
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
                @keyframes dashFlow {
                    to { stroke-dashoffset: -16; }
                }
                .node-float { animation: float 5s ease-in-out infinite; }
                .edge-flow { stroke-dasharray: 6; animation: dashFlow 2s linear infinite; }
                .bg-grid {
                    background-size: 60px 60px;
                    background-image: 
                        linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
                }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
            `}</style>

            <div className="fixed inset-0 bg-grid pointer-events-none z-0"></div>

            {/* Sidebar (Left Overlay) */}
            <aside
                className={`fixed top-14 bottom-4 left-4 w-72 rounded-3xl border border-slate-700/50 bg-[#0B1120]/60 backdrop-blur-2xl flex flex-col z-50 transition-all duration-500 ease-in-out shadow-2xl ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-[calc(100%+20px)] opacity-0 pointer-events-none'}`}
            >
                <div className="h-14 flex items-center justify-between px-5 border-b border-slate-800/30">
                    <div className="flex items-center">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center mr-3 shadow-lg shadow-sky-500/20">
                            <Activity className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-slate-200 font-bold text-sm tracking-tight text-white">Network View</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-slate-500 hover:text-white">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 pt-3 space-y-4 custom-scrollbar">
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Find skills or jobs..."
                            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-slate-200 focus:outline-none focus:border-sky-500/50 transition-colors"
                        />
                    </div>

                    <div>
                        <h3 className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">Skills ({data?.nodes.filter(n => n.type === 'skill').length})</h3>
                        <ul className="space-y-0.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {data?.nodes.filter(n => n.type === 'skill').map(s => (
                                <li
                                    key={s.id}
                                    onClick={() => handleNodeClick(s)}
                                    className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 cursor-pointer text-[10px] transition-all ${selectedNode?.id === s.id ? 'bg-sky-500/10 text-sky-400' : 'text-slate-400'}`}
                                >
                                    <Brain className="w-3 h-3" />
                                    <span className="flex-1 truncate">{s.label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="px-1 space-y-2 pt-4">
                        <h3 className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Network Stats</h3>
                        <div className="flex justify-between text-[11px]"><span className="text-slate-500">Skills</span><span className="text-slate-200 font-bold">{data?.nodes.filter(n => n.type === 'skill').length}</span></div>
                        <div className="flex justify-between text-[11px]"><span className="text-slate-500">Related Jobs</span><span className="text-slate-200 font-bold">{data?.nodes.filter(n => n.type === 'neighbor').length}</span></div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-800/50 text-[10px] text-slate-600 text-center">
                    Explore skill dependencies and cross-career paths.
                </div>
            </aside>

            {/* Center Canvas */}
            <main className="flex-1 relative z-10 flex flex-col overflow-hidden w-full">
                {/* Topbar */}
                <div className="h-12 flex items-center justify-between px-5 z-40 border-b border-slate-800/30 bg-[#0B1120]/80 backdrop-blur shrink-0">
                    <div className="flex items-center gap-4">
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl shadow-lg shadow-sky-500/20 transition-all scale-in"
                            >
                                <Search className="w-4 h-4" />
                            </button>
                        )}
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <Link to="/galaxy" className="hover:text-sky-400 transition-colors">Galaxy</Link>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-sky-400 font-medium">{targetOccupation?.label}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-[10px] text-slate-400 font-mono">{Math.round(scale * 100)}%</span>
                        <Share2 className="w-4 h-4 hover:text-white cursor-pointer" />
                    </div>
                </div>

                <div
                    className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                >
                    <div className="absolute inset-0" style={transformStyle}>
                        <svg className="absolute inset-0 overflow-visible" style={{ pointerEvents: 'none', width: WORLD_WIDTH, height: WORLD_HEIGHT }}>
                            {/* Orbit Rings */}
                            <circle cx={CX} cy={CY} r="400" fill="transparent" stroke="rgba(56, 189, 248, 0.05)" strokeWidth="1" strokeDasharray="8" />

                            {/* Links */}
                            {data?.links.map((link, i) => {
                                const source = data.nodes.find(n => n.id === link.source);
                                const target = data.nodes.find(n => n.id === link.target);
                                if (!source || !target || source.x === undefined || target.x === undefined) return null;

                                const isDimmed = (source as any).dimmed || (target as any).dimmed;

                                return (
                                    <line
                                        key={`link-${i}`}
                                        x1={source.x} y1={source.y}
                                        x2={target.x} y2={target.y}
                                        className={link.type === 'ESSENTIAL' ? 'edge-flow' : ''}
                                        stroke={source.type === 'occupation' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(129, 140, 248, 0.2)'}
                                        strokeWidth={1}
                                        style={{ opacity: isDimmed ? 0.05 : 1 }}
                                    />
                                );
                            })}
                        </svg>

                        {/* Nodes */}
                        {filteredNodes.map((node: any, i: number) => {
                            const size = node.type === 'occupation' ? 80 : (node.type === 'neighbor' ? 56 : 48);
                            const Icon = getNodeIcon(node.label, node.type);
                            const isDimmed = (node as any).dimmed;

                            return (
                                <div
                                    key={node.id}
                                    className={`absolute flex flex-col items-center node-float cursor-pointer transition-opacity duration-300 ${selectedNode?.id === node.id ? 'z-50' : 'z-20'}`}
                                    style={{
                                        left: (node.x || 0) - size / 2,
                                        top: (node.y || 0) - size / 2,
                                        width: size,
                                        animationDelay: `${i * 0.15}s`,
                                        opacity: isDimmed ? 0.15 : 1
                                    }}
                                    onClick={() => handleNodeClick(node as NetworkNode)}
                                >
                                    <div
                                        className={`rounded-2xl flex items-center justify-center border-2 transition-all flex-shrink-0`}
                                        style={{
                                            width: size,
                                            height: size,
                                            backgroundColor: '#1e293b',
                                            borderColor: selectedNode?.id === node.id ? '#38bdf8' : 'rgba(56, 189, 248, 0.2)',
                                            boxShadow: selectedNode?.id === node.id ? `0 0 30px rgba(56, 189, 248, 0.4)` : 'none',
                                            background: node.type === 'occupation' ? 'linear-gradient(135deg, #0f172a, #1e293b)' : '#1e293b'
                                        }}
                                    >
                                        <Icon className="w-1/2 h-1/2" style={{ color: node.color }} />
                                    </div>
                                    <span
                                        className={`text-[10px] mt-2 whitespace-nowrap px-2 py-0.5 rounded backdrop-blur-sm transition-colors ${selectedNode?.id === node.id ? 'bg-sky-500 text-white font-bold' : 'bg-black/40 text-slate-300'}`}
                                    >
                                        {node.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="absolute bottom-4 left-4 flex flex-col gap-1 z-40">
                    <button onClick={() => setScale(s => Math.min(1.5, s + 0.1))} className="w-7 h-7 rounded bg-slate-800/90 border border-slate-700 text-slate-300 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-all">+</button>
                    <button onClick={() => setScale(s => Math.max(0.2, s - 0.1))} className="w-7 h-7 rounded bg-slate-800/90 border border-slate-700 text-slate-300 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-all">−</button>
                    <button onClick={() => { setScale(0.5); setPanX(0); setPanY(0); }} className="w-7 h-7 rounded bg-slate-800/90 border border-slate-700 text-slate-300 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-all"><RotateCcw className="w-3.5 h-3.5" /></button>
                </div>
            </main>

            {/* Inspector (Right) */}
            <aside className="w-80 border-l border-slate-800/30 bg-[#0B1120]/40 backdrop-blur shrink-0 flex flex-col z-30">
                <div className="px-4 py-4 border-b border-slate-800/20">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg border-2 border-sky-400/40" style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(56, 189, 248, 0.1))' }}>
                            <Briefcase className="w-6 h-6 text-sky-400" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm font-bold text-slate-100 truncate">{targetOccupation?.label}</h2>
                            <p className="text-[10px] text-slate-500 italic">Target Career Path</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {selectedNode && (
                        <div className="p-4 space-y-4 fade-in">
                            <div>
                                <h3 className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Selected Node</h3>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${selectedNode.color}20`, border: `1px solid ${selectedNode.color}40` }}>
                                        {(() => {
                                            const Icon = getNodeIcon(selectedNode.label, selectedNode.type);
                                            return <Icon className="w-4 h-4" />;
                                        })()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-white truncate">{selectedNode.label}</p>
                                        <p className="text-[9px] text-slate-500" style={{ color: selectedNode.color }}>{selectedNode.type.toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-slate-400 leading-relaxed bg-slate-800/20 p-3 rounded-lg border border-slate-800/50">
                                {selectedNode.type === 'skill'
                                    ? 'This skill is essential for the target occupation and bridges to other career paths.'
                                    : 'A related career that requires similar skill sets. Explore this to broaden your horizon.'}
                            </p>

                            {selectedNode.type === 'neighbor' && (
                                <button
                                    onClick={() => navigate(`/occupation-network/${selectedNode.id}`)}
                                    className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
                                >
                                    Focus this Job <Microscope className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    )}

                    {!selectedNode && (
                        <div className="h-64 flex flex-col items-center justify-center text-center p-8 opacity-40">
                            <Info className="w-8 h-8 mb-2" />
                            <p className="text-xs">Select a node to inspect detailed career insights.</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-800/20">
                    <h3 className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Skill Categories</h3>
                    <div className="space-y-2">
                        {[
                            { label: 'Technical Skills', pct: 65, color: 'bg-sky-400' },
                            { label: 'Management', pct: 40, color: 'bg-indigo-400' },
                            { label: 'Tools', pct: 85, color: 'bg-emerald-400' }
                        ].map(c => (
                            <div key={c.label}>
                                <div className="flex justify-between text-[9px] mb-1">
                                    <span>{c.label}</span>
                                    <span>{c.pct}%</span>
                                </div>
                                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div className={`h-full ${c.color}`} style={{ width: `${c.pct}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>
        </div>
    );
}
