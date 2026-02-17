import { useState, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Orbit, ArrowLeft, ChevronRight, Search,
    Code, Brain, Cloud, Shield, PenTool, ClipboardList, TestTubes, GraduationCap,
    Maximize, Minimize,
    Book, Terminal, Container, Ship, GitMerge, FileCode, Activity, Network, GitBranch, Scroll, HeartPulse,
    PieChart, Database, Sliders, MessageSquare, FlaskConical, Layers, Server, Settings, Briefcase, BarChart2,
    Wrench, Rocket, Monitor, PanelLeft
} from 'lucide-react';
import { CATEGORIES, JOBS, SHARED_LINKS, WITHIN_SHARED } from '../data/galaxyData';

// Icon Map
const ICON_MAP: Record<string, any> = {
    'code': Code, 'brain': Brain, 'cloud': Cloud, 'shield': Shield,
    'pen-tool': PenTool, 'clipboard-list': ClipboardList, 'test-tubes': TestTubes,
    'graduation-cap': GraduationCap, 'orbit': Orbit,
    'terminal': Terminal, 'container': Container, 'ship': Ship, 'git-merge': GitMerge,
    'file-code': FileCode, 'activity': Activity, 'network': Network,
    'git-branch': GitBranch, 'scroll': Scroll, 'heart-pulse': HeartPulse,
    'pie-chart': PieChart, 'database': Database, 'sliders': Sliders, 'message-square': MessageSquare,
    'flask-conical': FlaskConical, 'layers': Layers, 'server': Server, 'settings': Settings,
    'briefcase': Briefcase, 'bar-chart-2': BarChart2, 'book': Book, 'wrench': Wrench,
    'rocket': Rocket, 'monitor': Monitor
};

const CX = 1000;
const CY = 800;

export default function CategoryViewPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [scale, setScale] = useState(0.65);
    const [panX, setPanX] = useState(0);
    const [panY, setPanY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const graphRef = useRef<HTMLDivElement>(null);
    const [search, setSearch] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Data Resolution
    const currentCat = useMemo(() => CATEGORIES.find(c => c.id === id) || CATEGORIES[0], [id]);

    // Layout Jobs for this view (different from Galaxy View layout)
    const catJobs = useMemo(() => {
        const jobs = JOBS.filter(j => j.cat === currentCat.id);
        return jobs.map((job, i) => {
            const count = jobs.length;
            const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
            const r = 200 + (i % 2) * 80;
            return {
                ...job,
                x: CX + Math.cos(angle) * r,
                y: CY + Math.sin(angle) * r,
                // Add dimming flag for search
                isMatch: !search || job.name.toLowerCase().includes(search.toLowerCase())
            };
        });
    }, [currentCat, search]);

    const catSharedWithin = useMemo(() => WITHIN_SHARED[currentCat.id] || [], [currentCat.id]);
    const catSharedCross = useMemo(() => SHARED_LINKS.filter(l => l.from === currentCat.id || l.to === currentCat.id), [currentCat.id]);

    // Stats
    const stats = useMemo(() => ({
        jobs: catJobs.length,
        skills: catJobs.reduce((s, j) => s + j.skills, 0),
        sharedIn: catSharedWithin.reduce((s, l) => s + l.shared, 0),
        sharedOut: catSharedCross.reduce((s, l) => s + l.shared, 0)
    }), [catJobs, catSharedWithin, catSharedCross]);

    // Interaction Handlers
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.04 : 0.04;
        setScale(s => Math.max(0.3, Math.min(1.5, s + delta)));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('a, button')) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPanX(e.clientX - dragStart.x);
        setPanY(e.clientY - dragStart.y);
    };

    const handleMouseUp = () => setIsDragging(false);

    // Helpers for Edge Calculation (Boundary Intersection)
    const getJobEdge = (ja: typeof catJobs[0], jb: typeof catJobs[0]) => {
        const dx = jb.x - ja.x;
        const dy = jb.y - ja.y;
        const angle = Math.atan2(dy, dx);
        const r = 22; // 44px / 2
        return {
            x1: ja.x + Math.cos(angle) * r,
            y1: ja.y + Math.sin(angle) * r,
            x2: jb.x - Math.cos(angle) * r,
            y2: jb.y - Math.sin(angle) * r,
            mx: (ja.x + jb.x) / 2,
            my: (ja.y + jb.y) / 2
        };
    };

    const getCrossEdge = (targetCatId: string) => {
        const idx = CATEGORIES.findIndex(c => c.id === targetCatId);
        const angle = (idx / CATEGORIES.length) * Math.PI * 2 - Math.PI / 2;
        const px = CX + Math.cos(angle) * 480;
        const py = CY + Math.sin(angle) * 380;

        const dx = px - CX;
        const dy = py - CY;
        const ang = Math.atan2(dy, dx);
        const rStart = 35; // 70px / 2
        const rEnd = 24;   // 48px / 2

        return {
            x1: CX + Math.cos(ang) * rStart,
            y1: CY + Math.sin(ang) * rStart,
            x2: px - Math.cos(ang) * rEnd,
            y2: py - Math.sin(ang) * rEnd,
            px, py,
            mx: (CX + px) / 2,
            my: (CY + py) / 2
        };
    };

    const CatIcon = ICON_MAP[currentCat.icon] || Code;

    return (
        <div className="h-[100dvh] flex overflow-hidden galaxy-root text-slate-400 bg-[#0B1120]">
            {/* Background */}
            <div className="fixed inset-0 bg-grid pointer-events-none z-0 opacity-20"></div>
            <div className="fixed top-0 left-1/3 w-[600px] h-[600px] bg-sky-500/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-500/5 blur-[120px] rounded-full pointer-events-none"></div>

            {/* Sidebar */}
            <aside
                className={`border-r border-slate-800 bg-[#0B1120]/80 backdrop-blur-xl flex flex-col z-30 shrink-0 transition-all duration-300 ease-in-out relative ${sidebarOpen ? 'w-64' : 'w-0 border-r-0 overflow-hidden'}`}
            >
                {/* Toggle Button Inside Sidebar (Visible when open) */}
                {sidebarOpen && (
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center hover:text-white z-40 shadow-lg"
                        title="ปิดแถบข้าง"
                    >
                        <PanelLeft className="w-3.5 h-3.5 transition-transform" style={{ transform: 'rotate(180deg)' }} />
                    </button>
                )}

                <div className={`flex flex-col h-full overflow-hidden transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="h-12 flex items-center px-4 border-b border-slate-800/50 shrink-0">
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center mr-2 shadow shadow-sky-500/20">
                            <Orbit className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-slate-200 font-bold text-sm tracking-tight whitespace-nowrap">AI-Learn Galaxy</span>
                    </div>

                    <nav className="flex-1 overflow-y-auto px-3 pt-3 space-y-4">
                        {/* Essential Nav */}
                        <div className="space-y-1">
                            <Link
                                to="/settings"
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all text-[11px]"
                            >
                                <Settings className="w-3.5 h-3.5" />
                                <span>Settings</span>
                            </Link>
                            <Link
                                to="/esco-dashboard"
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all text-[11px]"
                            >
                                <Database className="w-3.5 h-3.5" />
                                <span>ESCO Dashboard</span>
                            </Link>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50"
                                placeholder="Find job..."
                            />
                        </div>

                        <Link to="/galaxy" className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-800/30 border border-slate-700/30 text-xs text-slate-400 hover:text-primary hover:border-primary/30 transition-all">
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to Galaxy
                        </Link>

                        <div>
                            <h3 className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">Categories</h3>
                            <ul className="space-y-1">
                                {CATEGORIES.map(cat => {
                                    const active = cat.id === currentCat.id;
                                    const cnt = JOBS.filter(j => j.cat === cat.id).length;
                                    return (
                                        <li key={cat.id}>
                                            <Link to={`/category/${cat.id}`} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all ${active ? 'bg-white/10 border border-white/10' : 'hover:bg-white/5'}`}>
                                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }}></span>
                                                <span className={`text-[11px] flex-1 truncate ${active ? 'text-white font-semibold' : 'text-slate-300'}`}>{cat.name}</span>
                                                <span className="text-[9px] text-slate-600 font-mono">{cnt}</span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        <div className="px-1 space-y-1.5">
                            <h3 className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Detailed Stats</h3>
                            <div className="flex justify-between text-[11px]"><span className="text-slate-500">Jobs</span><span className="text-slate-200 font-bold">{stats.jobs}</span></div>
                            <div className="flex justify-between text-[11px]"><span className="text-slate-500">Skills</span><span className="text-slate-200 font-bold">{stats.skills}</span></div>
                            <div className="flex justify-between text-[11px]"><span className="text-slate-500">Shared Within</span><span className="text-yellow-400 font-bold">{stats.sharedIn}</span></div>
                            <div className="flex justify-between text-[11px]"><span className="text-slate-500">Shared Out</span><span className="text-teal-400 font-bold">{stats.sharedOut}</span></div>
                        </div>

                        <div className="px-1 text-[10px] text-slate-600 space-y-2 mt-4">
                            <h3 className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Legend</h3>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-[10px]"><span className="w-4 h-1 rounded-full bg-yellow-400/60 transition-colors"></span><span className="text-slate-500">Shared within category</span></div>
                                <div className="flex items-center gap-2 text-[10px]"><span className="w-4 h-1 rounded-full bg-teal-400/60 transition-colors"></span><span className="text-slate-500">Cross-category shared</span></div>
                                <div className="flex items-center gap-2 text-[10px]"><span className="w-3 h-3 rounded-full border border-slate-600"></span><span className="text-slate-500">L2 Job Title node</span></div>
                            </div>
                        </div>
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 relative z-10 flex flex-col overflow-hidden">
                {/* Floating Open Toggle (Visible when closed) */}
                {!sidebarOpen && (
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="absolute left-4 top-20 w-8 h-8 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-400 flex items-center justify-center hover:bg-slate-700 hover:text-white z-40 shadow-xl transition-all animate-in slide-in-from-left-4 fade-in duration-300"
                        title="เปิดแถบข้าง"
                    >
                        <PanelLeft className="w-4 h-4" />
                    </button>
                )}
                {/* Top Bar */}
                <div className="h-12 flex items-center justify-between px-5 z-40 border-b border-slate-800/30 bg-[#0B1120]/80 backdrop-blur shrink-0">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Link to="/galaxy" className="hover:text-primary transition-colors">Galaxy</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-primary font-medium">{currentCat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-[10px] text-slate-400 font-mono">{stats.jobs} jobs</span>
                    </div>
                </div>

                {/* Category Header */}
                <div className="px-6 py-4 border-b border-slate-800/20 shrink-0 fade-in">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl border-2"
                            style={{ background: `linear-gradient(135deg,${currentCat.color}30,${currentCat.color}10)`, borderColor: `${currentCat.color}40` }}>
                            <CatIcon className="w-7 h-7" style={{ color: currentCat.color }} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-100 tracking-tight">{currentCat.name}</h1>
                            <p className="text-sm text-slate-500 mt-0.5">{stats.jobs} occupations • {stats.skills} total skills</p>
                        </div>
                        <div className="ml-auto flex gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-[10px] text-yellow-400 font-bold transition-all hover:bg-yellow-500/20">{stats.sharedIn} shared within</span>
                            <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-[10px] text-teal-400 font-bold transition-all hover:bg-teal-500/20">{stats.sharedOut} cross-category</span>
                        </div>
                    </div>
                </div>

                {/* Graph */}
                <div className="flex-1 flex overflow-hidden">
                    <div
                        ref={graphRef}
                        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
                        onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
                    >
                        <div className="absolute inset-0" style={{
                            transform: `translate(calc(50% - ${CX * scale}px + ${panX}px), calc(50% - ${CY * scale}px + ${panY}px)) scale(${scale})`,
                            transformOrigin: '0 0'
                        }}>
                            <svg className="absolute top-0 left-0 overflow-visible" width={CX * 2} height={CY * 2} style={{ pointerEvents: 'none' }}>
                                {/* Rings */}
                                <circle cx={CX} cy={CY} r="350" fill={`${currentCat.color}04`} stroke={`${currentCat.color}10`} strokeWidth="1.5" strokeDasharray="8" />
                                <circle cx={CX} cy={CY} r="200" fill={`${currentCat.color}03`} stroke={`${currentCat.color}08`} strokeWidth="1" />

                                {/* Within edges */}
                                {catSharedWithin.map((link, i) => {
                                    const ja = catJobs.find(j => j.id === link.a);
                                    const jb = catJobs.find(j => j.id === link.b);
                                    if (!ja || !jb || !ja.isMatch || !jb.isMatch) return null;
                                    const { x1, y1, x2, y2, mx, my } = getJobEdge(ja, jb);
                                    const opacity = Math.min(0.5, link.shared / 20);
                                    const width = 0.5 + (link.shared / 10);
                                    return (
                                        <g key={`in-${i}`}>
                                            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={`rgba(250,204,21,${opacity})`} strokeWidth={width} strokeDasharray="6" style={{ animation: 'dashFlow 2s linear infinite' }} />
                                            <circle cx={mx} cy={my} r="12" fill="#1e293b" stroke="rgba(250,204,21,0.4)" strokeWidth="1" />
                                            <text x={mx} y={my + 4} textAnchor="middle" fill="#facc15" fontSize="8" fontWeight="bold" fontFamily="Inter">{link.shared}</text>
                                        </g>
                                    );
                                })}

                                {catSharedCross.map((link, i) => {
                                    const otherCatId = link.from === currentCat.id ? link.to : link.from;
                                    const { x1, y1, x2, y2, mx, my } = getCrossEdge(otherCatId);
                                    const opacity = Math.min(0.5, link.shared / 20);
                                    return (
                                        <g key={`cross-${i}`}>
                                            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={`rgba(45,212,191,${opacity})`} strokeWidth={0.5 + link.shared / 10} strokeDasharray="2 3" style={{ animation: 'dashFlow 1.5s linear infinite' }} />
                                            <circle cx={mx} cy={my} r="12" fill="#1e293b" stroke="rgba(45,212,191,0.4)" strokeWidth="1" className="transition-all hover:stroke-teal-400" />
                                            <text x={mx} y={my + 4} textAnchor="middle" fill="#2dd4bf" fontSize="8" fontWeight="bold" fontFamily="Inter">{link.shared}</text>
                                        </g>
                                    );
                                })}
                            </svg>

                            {/* Center Node */}
                            <div className="absolute flex flex-col items-center" style={{ left: CX, top: CY, transform: 'translate(-50%, -35px)' }}>
                                <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center shadow-xl border-2"
                                    style={{ background: `linear-gradient(135deg,${currentCat.color}30,${currentCat.color}10)`, borderColor: `${currentCat.color}40`, boxShadow: `0 0 40px ${currentCat.color}20` }}>
                                    <CatIcon className="w-8 h-8" style={{ color: currentCat.color }} />
                                </div>
                                <span className="text-[11px] font-bold mt-1.5 whitespace-nowrap" style={{ color: currentCat.color }}>{currentCat.name}</span>
                            </div>

                            {/* Job Nodes */}
                            {catJobs.map(job => (
                                <div key={job.id}
                                    className="absolute flex flex-col items-center cursor-pointer group"
                                    style={{
                                        left: job.x,
                                        top: job.y,
                                        transform: 'translate(-50%, -22px)',
                                        opacity: job.isMatch ? 1 : 0.2,
                                        transition: 'opacity 0.3s'
                                    }}
                                    onClick={() => navigate(`/job/${job.id}`)}
                                >
                                    <div className="w-[44px] h-[44px] rounded-full bg-slate-800/90 border-2 flex items-center justify-center group-hover:scale-125 transition-all shadow-lg"
                                        style={{ borderColor: `${currentCat.color}50`, boxShadow: `0 0 12px ${currentCat.color}15` }}>
                                        <div className="w-3 h-3 rounded-full" style={{ background: currentCat.color }}></div>
                                    </div>
                                    <span className="text-[9px] text-slate-300 font-medium mt-1 text-center whitespace-nowrap group-hover:text-white">{job.name}</span>
                                    <span className="text-[7px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">{job.skills} skills</span>
                                </div>
                            ))}

                            {/* Ghost Nodes */}
                            {catSharedCross.map((link, i) => {
                                const otherCatId = link.from === currentCat.id ? link.to : link.from;
                                const otherCat = CATEGORIES.find(c => c.id === otherCatId)!;
                                const { px, py } = getCrossEdge(otherCatId);
                                const OtherIcon = ICON_MAP[otherCat.icon] || Code;
                                return (
                                    <Link key={`ghost-${i}`} to={`/category/${otherCatId}`}
                                        className="absolute flex flex-col items-center cursor-pointer group"
                                        style={{ left: px, top: py, transform: 'translate(-50%, -24px)' }}>
                                        <div className="w-[48px] h-[48px] rounded-full flex items-center justify-center border opacity-40 group-hover:opacity-80 group-hover:scale-110 transition-all"
                                            style={{ background: `${otherCat.color}15`, borderColor: `${otherCat.color}30` }}>
                                            <OtherIcon className="w-5 h-5" style={{ color: otherCat.color }} />
                                        </div>
                                        <span className="text-[8px] mt-0.5 opacity-50 group-hover:opacity-100 transition-all whitespace-nowrap" style={{ color: otherCat.color }}>{otherCat.name}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Panel */}
                    <div className="w-72 border-l border-slate-800/30 overflow-y-auto bg-[#0B1120]/40 backdrop-blur px-4 py-4 space-y-3 shrink-0">
                        <h3 className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider px-1">L2 Job Titles</h3>
                        <div className="space-y-2">
                            {catJobs.filter(j => j.isMatch).map(job => (
                                <Link key={job.id} to={`/job/${job.id}`} className="block p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-slate-600 hover:bg-slate-800/50 transition-all cursor-pointer group">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: `${currentCat.color}20` }}>
                                            <div className="w-2 h-2 rounded-full" style={{ background: currentCat.color }}></div>
                                        </div>
                                        <span className="text-[11px] text-slate-200 font-semibold group-hover:text-primary transition-colors">{job.name}</span>
                                        <span className="text-[9px] text-slate-600 ml-auto font-mono">{job.skills}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 ml-8">
                                        {job.topSkills?.map(s => <span key={s} className="text-[8px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">{s}</span>)}
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <h3 className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider px-1 mt-4">Cross-Category Links</h3>
                        <div className="space-y-1.5">
                            {catSharedCross.map(link => {
                                const otherCatId = link.from === currentCat.id ? link.to : link.from;
                                const otherCat = CATEGORIES.find(c => c.id === otherCatId)!;
                                const OtherIcon = ICON_MAP[otherCat.icon] || Code;
                                return (
                                    <Link key={otherCat.id} to={`/category/${otherCat.id}`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-500/5 border border-teal-500/10 hover:border-teal-500/30 transition-all group">
                                        <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center" style={{ background: `${otherCat.color}20` }}>
                                            <OtherIcon className="w-2.5 h-2.5" style={{ color: otherCat.color }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-slate-300 font-medium group-hover:text-teal-300 truncate">{otherCat.name}</p>
                                            <p className="text-[8px] text-slate-600 truncate">{link.top}</p>
                                        </div>
                                        <span className="text-[9px] text-teal-400 font-bold shrink-0">{link.shared}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
