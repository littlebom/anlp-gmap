import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    Database,
    Briefcase,
    Wrench,
    Activity,
    RefreshCw,
    LayoutDashboard,
    Settings,
    Star
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface EscoStats {
    iscoGroups: number;
    occupations: number;
    skills: number;
    relations: number;
}

const EscoDashboardPage = () => {
    const [stats, setStats] = useState<EscoStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sidebarCollapsed] = useState(false);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3000/esco/stats');
            if (!response.ok) throw new Error('Failed to fetch stats');
            const data = await response.json();
            setStats(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 10000); // Auto-refresh every 10s
        return () => clearInterval(interval);
    }, []);

    const StatCard = ({ title, value, icon: Icon, color, bg }: any) => (
        <div className={`p-6 rounded-2xl ${bg} border border-white/5 flex flex-col gap-4 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300`}>
            <div className={`absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500`}>
                <Icon size={120} />
            </div>
            <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${color} bg-white/10`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">Real-time</div>
            </div>
            <div>
                <div className="text-3xl font-bold text-white mb-1">
                    {loading && !stats ? '...' : (value || 0).toLocaleString()}
                </div>
                <div className="text-sm text-white/60 font-medium">{title}</div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 flex overflow-hidden">
            {/* Sidebar */}
            <aside className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-[#020617] border-r border-white/5 flex flex-col transition-all duration-500 relative z-20`}>
                <div className="p-6 flex items-center gap-4 border-b border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                        <Database className="w-6 h-6 text-white" />
                    </div>
                    {!sidebarCollapsed && <span className="text-xl font-bold tracking-tight text-white">ANLP <span className="text-sky-400">GSM</span></span>}
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                    <Link to="/galaxy" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-slate-400 transition-all">
                        <LayoutDashboard className="w-5 h-5 text-sky-400" />
                        {!sidebarCollapsed && <span>Galaxy View</span>}
                    </Link>
                    <Link to="/esco-dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 text-white active-nav-shadow">
                        <Database className="w-5 h-5 text-indigo-400" />
                        {!sidebarCollapsed && <span>ESCO Dashboard</span>}
                    </Link>
                    <Link to="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-slate-400 transition-all">
                        <Settings className="w-5 h-5 text-slate-400" />
                        {!sidebarCollapsed && <span>Settings</span>}
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-[#020617]">
                <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <Activity className="w-5 h-5 text-sky-400" />
                        <h1 className="text-xl font-bold text-white tracking-tight">Ingestion Monitoring</h1>
                    </div>
                    <button
                        onClick={fetchStats}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold uppercase tracking-widest text-white/60 transition-all active:scale-95"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {error && (
                        <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Connection Error: {error}. Make sure the backend is running.
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        <StatCard
                            title="ISCO Hierarchy Groups"
                            value={stats?.iscoGroups}
                            icon={BarChart3}
                            color="text-amber-400"
                            bg="bg-amber-500/10"
                        />
                        <StatCard
                            title="Standard Occupations"
                            value={stats?.occupations}
                            icon={Briefcase}
                            color="text-emerald-400"
                            bg="bg-emerald-500/10"
                        />
                        <StatCard
                            title="Skills & Competencies"
                            value={stats?.skills}
                            icon={Star}
                            color="text-sky-400"
                            bg="bg-sky-500/10"
                        />
                        <StatCard
                            title="Skill Relationships"
                            value={stats?.relations}
                            icon={Wrench}
                            color="text-indigo-400"
                            bg="bg-indigo-500/10"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-3xl overflow-hidden relative group">
                            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                                <RefreshCw className="w-5 h-5 text-sky-400" />
                                Ingestion Progress
                            </h2>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-white/60">Occupations (Target: 3,039)</span>
                                        <span className="text-white font-mono">{stats ? Math.round((stats.occupations / 3039) * 100) : 0}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-1000 ease-out"
                                            style={{ width: `${stats ? Math.min(100, (stats.occupations / 3039) * 100) : 0}%` }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-white/60">Skills (Target: ~13,900)</span>
                                        <span className="text-white font-mono">{stats ? Math.round((stats.skills / 13900) * 100) : 0}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all duration-1000 ease-out"
                                            style={{ width: `${stats ? Math.min(100, (stats.skills / 13900) * 100) : 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 p-4 rounded-xl bg-sky-500/5 border border-sky-500/10 text-xs text-sky-300 leading-relaxed">
                                <span className="font-bold uppercase tracking-wider block mb-1">Information:</span>
                                The data is being pulled recursively from the ESCO REST API. This dashboard refreshes every 10 seconds to show the latest progress.
                            </div>
                        </div>

                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-3xl">
                            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                                <Database className="w-5 h-5 text-indigo-400" />
                                Ingestion Script Status
                            </h2>

                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4 animate-pulse">
                                    <Activity className="w-8 h-8 text-indigo-400" />
                                </div>
                                <h3 className="text-white font-semibold mb-2">Ready to Start</h3>
                                <p className="text-sm text-white/40 max-w-xs mx-auto mb-6">
                                    The script `esco-ingest.ts` is ready to be executed from your terminal to begin the process.
                                </p>
                                <code className="px-4 py-2 rounded-lg bg-black/40 border border-white/5 text-xs text-indigo-300 font-mono">
                                    npx ts-node src/scripts/esco-ingest.ts
                                </code>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.1); }
        .active-nav-shadow {
          box-shadow: 0 0 20px -5px rgba(96, 165, 250, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
        </div>
    );
};

export default EscoDashboardPage;
