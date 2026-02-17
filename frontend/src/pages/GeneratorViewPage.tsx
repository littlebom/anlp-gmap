import { useState, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Search, ArrowLeft, ChevronRight,
    Terminal, Container, Ship, GitMerge, FileCode, Cloud, Activity, Network, Shield, GitBranch, Scroll, HeartPulse,
    Code, Brain, PieChart, Database, Sliders, MessageSquare, FlaskConical, Layers, Server, Settings, Briefcase, BarChart2,
    Book, Wrench, Rocket, Monitor
} from 'lucide-react';
import { JOB_DATA, getGenericJob, type JobDetail } from '../data/jobData';
import { CATEGORIES } from '../data/galaxyData';

// Icon Map
const ICON_MAP: Record<string, any> = {
    'terminal': Terminal, 'container': Container, 'ship': Ship, 'git-merge': GitMerge,
    'file-code': FileCode, 'cloud': Cloud, 'activity': Activity, 'network': Network,
    'shield': Shield, 'git-branch': GitBranch, 'scroll': Scroll, 'heart-pulse': HeartPulse,
    'code': Code, 'brain': Brain, 'pie-chart': PieChart, 'database': Database,
    'sliders': Sliders, 'message-square': MessageSquare, 'flask-conical': FlaskConical,
    'layers': Layers, 'server': Server, 'settings': Settings, 'briefcase': Briefcase,
    'bar-chart-2': BarChart2, 'book': Book, 'wrench': Wrench, 'rocket': Rocket,
    'monitor': Monitor
};

const CX = 1000;
const CY = 800;

export default function GeneratorViewPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [scale, setScale] = useState(0.5); // Initial zoom
    const [panX, setPanX] = useState(0);
    const [panY, setPanY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const graphRef = useRef<HTMLDivElement>(null);

    // Data
    const jobData = useMemo(() => {
        const data = JOB_DATA[id || ''] || getGenericJob(id || 'unknown');
        // Clone to avoid mutating original
        return JSON.parse(JSON.stringify(data)) as JobDetail;
    }, [id]);

    const catData = useMemo(() => CATEGORIES.find(c => c.id === jobData.cat) || CATEGORIES[0], [jobData]);

    // Layout
    const layout = useMemo(() => {
        const skills = jobData.skills;
        const count = skills.length;

        // Step 1: Position L3 skills
        skills.forEach((skill, i) => {
            const ring = skill.status === 'locked' ? 2.2 : (skill.sfia >= 3 ? 1.6 : 1);
            const r = 280 * ring;
            const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
            skill.x = CX + Math.cos(angle) * r;
            skill.y = CY + Math.sin(angle) * r;
        });

        // Step 2: L4 Sub-skills fan out
        const subR = 90;
        skills.forEach(skill => {
            if (!skill.x || !skill.y) return;
            const outAngle = Math.atan2(skill.y - CY, skill.x - CX);
            const n = skill.subSkills.length;
            const fanSpread = Math.min(Math.PI * 0.8, n * 0.45);

            skill.subSkillPositions = skill.subSkills.map((sub, si) => {
                const t = n === 1 ? 0 : (si / (n - 1) - 0.5);
                const subAngle = outAngle + t * fanSpread;
                return {
                    name: sub,
                    x: (skill.x || 0) + Math.cos(subAngle) * subR,
                    y: (skill.y || 0) + Math.sin(subAngle) * subR
                };
            });
        });

        // Step 3: Collision resolution for sub-skills
        const allSubs: any[] = [];
        skills.forEach(s => {
            if (s.subSkillPositions) allSubs.push(...s.subSkillPositions);
        });

        const minDist = 48;
        for (let pass = 0; pass < 12; pass++) {
            for (let a = 0; a < allSubs.length; a++) {
                for (let b = a + 1; b < allSubs.length; b++) {
                    const dx = allSubs[b].x - allSubs[a].x;
                    const dy = allSubs[b].y - allSubs[a].y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < minDist && d > 0) {
                        const push = (minDist - d) / 2;
                        const nx = dx / d;
                        const ny = dy / d;
                        allSubs[a].x -= nx * push;
                        allSubs[a].y -= ny * push;
                        allSubs[b].x += nx * push;
                        allSubs[b].y += ny * push;
                    }
                }
            }
        }
        return skills;
    }, [jobData]);

    const selectedSkill = useMemo(() => layout.find(s => s.id === selectedSkillId), [layout, selectedSkillId]);

    // Canvas Transform
    const transformStyle = {
        transform: `translate(calc(50% - ${CX * scale}px + ${panX}px), calc(50% - ${CY * scale}px + ${panY}px)) scale(${scale})`,
        transformOrigin: '0 0'
    };

    // Interaction Handlers
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.04 : 0.04;
        setScale(s => Math.max(0.2, Math.min(1.5, s + delta)));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button, a')) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPanX(e.clientX - dragStart.x);
        setPanY(e.clientY - dragStart.y);
    };

    const handleMouseUp = () => setIsDragging(false);

    // Filter
    const filteredSkills = useMemo(() => {
        if (!search) return layout;
        const lower = search.toLowerCase();
        return layout.map(s => ({
            ...s,
            dimmed: !s.name.toLowerCase().includes(lower)
        }));
    }, [layout, search]);

    const CatIcon = ICON_MAP[catData.icon] || Code;

    return (
        <div className="h-[100dvh] flex overflow-hidden galaxy-root text-slate-400 bg-[#0B1120]">
            {/* Background */}
            <div className="fixed inset-0 bg-grid pointer-events-none z-0 opacity-20"></div>

            {/* Sidebar */}
            <aside className="w-72 border-r border-slate-800 bg-[#0B1120]/80 backdrop-blur-xl flex flex-col z-30 shrink-0">
                <div className={`h-12 flex items-center px-4 border-b border-slate-800/50`} style={{ borderTop: `2px solid ${catData.color}` }}>
                    <div className="mr-2">
                        <ArrowLeft className="w-4 h-4 hover:text-white cursor-pointer" onClick={() => navigate(`/category/${catData.id}`)} />
                    </div>
                    <span className="text-slate-200 font-bold text-sm tracking-tight truncate">{jobData.name}</span>
                </div>

                <div className="p-3">
                    <div className="relative mb-3">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-slate-200 focus:outline-none focus:border-sky-500/50"
                            placeholder="Find skill..."
                        />
                    </div>

                    <div className="flex gap-2 mb-2 text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
                        <div className="flex items-center gap-1"><span className="text-accent">✓</span> Mastered ({jobData.skills.filter(s => s.status === 'mastered').length})</div>
                        <div className="flex items-center gap-1"><span className="text-slate-600">🔒</span> Locked ({jobData.skills.filter(s => s.status === 'locked').length})</div>
                    </div>

                    <div className="space-y-1 h-[calc(100vh-180px)] overflow-y-auto pr-1 custom-scrollbar">
                        {filteredSkills.map(s => (
                            <div key={s.id}
                                onClick={() => setSelectedSkillId(s.id)}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all ${selectedSkillId === s.id ? 'bg-slate-700/50 text-white' : 'hover:bg-slate-800/50'} ${(s as any).dimmed ? 'opacity-20' : ''}`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'mastered' ? 'bg-accent' : (s.status === 'locked' ? 'bg-slate-600' : 'bg-primary')}`}></div>
                                <span className={`flex-1 text-[11px] truncate ${s.status === 'locked' ? 'text-slate-500' : 'text-slate-300'}`}>{s.name}</span>
                                <span className="text-[9px] text-slate-600 font-mono">L{s.sfia + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Main Graph */}
            <main className="flex-1 relative z-10 flex flex-col overflow-hidden">
                {/* Top Bar breadcrumb */}
                <div className="h-12 flex items-center justify-between px-5 z-40 border-b border-slate-800/30 bg-[#0B1120]/80 backdrop-blur shrink-0">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Link to="/galaxy" className="hover:text-primary">Galaxy</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link to={`/category/${catData.id}`} className="hover:text-primary">{catData.name}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-primary font-medium">{jobData.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono">{Math.round(scale * 100)}%</span>
                    </div>
                </div>

                <div
                    ref={graphRef}
                    className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <div className="absolute inset-0" style={transformStyle}>
                        <svg className="absolute top-0 left-0 overflow-visible" width={CX * 2} height={CY * 2} style={{ pointerEvents: 'none' }}>
                            {/* Rings */}
                            <circle cx={CX} cy={CY} r="280" fill={`${catData.color}04`} stroke={`${catData.color}15`} strokeWidth="1.5" strokeDasharray="8" />
                            <circle cx={CX} cy={CY} r="450" fill={`${catData.color}02`} stroke={`${catData.color}08`} strokeWidth="1" />

                            {/* Edges */}
                            {jobData.edges.map(([fromId, toId]) => {
                                const from = layout.find(s => s.id === fromId);
                                const to = layout.find(s => s.id === toId);
                                if (!from || !to || !from.x || !from.y || !to.x || !to.y) return null;
                                const locked = from.status === 'locked' || to.status === 'locked';
                                // Check if dimmed
                                const isDimmed = (from as any).dimmed || (to as any).dimmed;
                                return (
                                    <line key={`e-${fromId}-${toId}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                                        stroke={locked ? '#1e293b' : '#334155'} strokeWidth="1" strokeDasharray="6"
                                        style={{ opacity: isDimmed ? 0.1 : 1 }}
                                    />
                                );
                            })}

                            {/* Sub-skill Edges */}
                            {layout.map(s => {
                                if (s.status === 'locked' || !s.subSkillPositions || (s as any).dimmed) return null;
                                return s.subSkillPositions.map((sub, si) => (
                                    <line key={`se-${s.id}-${si}`} x1={s.x} y1={s.y} x2={sub.x} y2={sub.y} stroke="rgba(99,102,241,0.15)" strokeWidth="0.8" />
                                ));
                            })}
                        </svg>

                        {/* Center Node */}
                        <div className="absolute flex flex-col items-center" style={{ left: CX - 35, top: CY - 35 }}>
                            <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center shadow-xl border-2 z-10"
                                style={{ background: `linear-gradient(135deg,${catData.color}30,${catData.color}10)`, borderColor: `${catData.color}40`, boxShadow: `0 0 40px ${catData.color}20` }}>
                                <CatIcon className="w-8 h-8 text-white" />
                                <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-white text-slate-900 font-bold px-1.5 py-0.5 rounded-full shadow">L2</span>
                            </div>
                            <span className="text-[11px] text-slate-100 font-bold mt-1.5 whitespace-nowrap">{jobData.name}</span>
                        </div>

                        {/* Skill Nodes */}
                        {layout.map((s, i) => {
                            const isLocked = s.status === 'locked';
                            const isMastered = s.status === 'mastered';
                            const isDimmed = (s as any).dimmed;
                            const SIcon = ICON_MAP[s.icon] || Code;
                            const size = isMastered ? 44 : (isLocked ? 36 : 40);

                            return (
                                <div key={s.id}
                                    className={`absolute flex flex-col items-center group ${isLocked ? '' : 'cursor-pointer'}`}
                                    style={{ left: (s.x || 0) - size / 2, top: (s.y || 0) - size / 2, opacity: isDimmed ? 0.1 : 1, transition: 'all 0.3s' }}
                                    onClick={() => !isLocked && setSelectedSkillId(s.id)}
                                >
                                    <div className={`w-[${size}px] h-[${size}px] rounded-full flex items-center justify-center shadow-md relative transition-transform ${isLocked ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-slate-800 border-2 hover:scale-110'}`}
                                        style={{
                                            width: size, height: size,
                                            borderColor: isMastered ? `${catData.color}60` : (isLocked ? '' : `${catData.color}40`),
                                            boxShadow: selectedSkillId === s.id ? `0 0 0 4px ${catData.color}30` : ''
                                        }}>
                                        <SIcon className={`w-${isMastered ? 5 : 4} h-${isMastered ? 5 : 4}`} style={{ color: isLocked ? '#64748b' : catData.color }} />
                                        <span className="absolute -top-1 -right-1 text-[7px] font-bold px-1 py-0.5 rounded-full border"
                                            style={{ background: isLocked ? '#334155' : `${catData.color}20`, color: isLocked ? '#64748b' : catData.color, borderColor: isLocked ? 'transparent' : `${catData.color}30` }}>
                                            {isLocked ? 'L5' : (s.sfia >= 3 ? 'L4' : 'L3')}
                                        </span>
                                    </div>
                                    <span className={`text-[9px] font-medium mt-1 text-center leading-tight max-w-[80px] ${isLocked ? 'text-slate-500' : 'text-slate-300'}`}>{s.name}</span>

                                    {/* Sub-skills (L4) */}
                                    {s.subSkillPositions && !isLocked && !isDimmed && (
                                        <>
                                            {s.subSkillPositions.map((sub, si) => (
                                                <div key={`sub-${si}`} className="absolute w-[80px] flex flex-col items-center"
                                                    style={{
                                                        left: sub.x - (s.x || 0) + size / 2 - 40,
                                                        top: sub.y - (s.y || 0) + size / 2 - 10,
                                                    }}>
                                                    <div className="w-[34px] h-[34px] rounded-full bg-slate-800/80 border flex items-center justify-center hover:scale-110 transition-all shadow-sm"
                                                        style={{ borderColor: `${catData.color}30` }}>
                                                        <div className="w-2 h-2 rounded-full" style={{ background: `${catData.color}90` }}></div>
                                                    </div>
                                                    <span className="text-[8px] text-slate-400 mt-0.5 text-center leading-tight bg-slate-900/40 px-1 rounded backdrop-blur-sm">{sub.name}</span>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Inspector Panel (Bottom Right or Overlay) */}
                {selectedSkill && (
                    <div className="absolute bottom-6 right-6 w-80 bg-[#0F172A]/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-5 fade-in z-50">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                                    {(() => {
                                        const SIcon = ICON_MAP[selectedSkill.icon] || Code;
                                        return <SIcon className="w-5 h-5 text-sky-400" />;
                                    })()}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-100">{selectedSkill.name}</h3>
                                    <div className="flex gap-2 text-[10px] text-slate-400 mt-1">
                                        <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Level {selectedSkill.sfia}</span>
                                        <span className={`px-1.5 py-0.5 rounded border ${selectedSkill.status === 'mastered' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-sky-500/10 border-sky-500/20 text-sky-400'}`}>
                                            {selectedSkill.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedSkillId(null)} className="text-slate-500 hover:text-white transition-colors">×</button>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed mb-4">{selectedSkill.desc}</p>

                        <div>
                            <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Sub-skills (L{selectedSkill.sfia + 1})</h4>
                            <div className="flex flex-wrap gap-1.5">
                                {selectedSkill.subSkills.map(sub => (
                                    <span key={sub} className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700/50 text-[10px] text-slate-300">
                                        {sub}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-800/50 flex gap-2">
                            <button className="flex-1 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-medium transition-colors">Start Learning</button>
                            <button className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors border border-slate-700">History</button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
