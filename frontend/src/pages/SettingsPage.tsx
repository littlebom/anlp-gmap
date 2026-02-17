import { useState } from 'react';
import {
    Orbit, Settings, Database, Cloud, Globe, Save, CheckCircle2, AlertCircle,
    PanelLeft, LogOut, Search, RefreshCw, XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { CATEGORIES, STATS } from '../data/galaxyData';

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

export default function SettingsPage() {
    const { user, logout } = useAuthStore();
    const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [search, setSearch] = useState('');

    // API Connection Statuses
    const [escoStatus, setEscoStatus] = useState<ConnectionStatus>('idle');
    const [onetStatus, setOnetStatus] = useState<ConnectionStatus>('idle');
    const [lightcastStatus, setLightcastStatus] = useState<ConnectionStatus>('idle');

    // Mock settings state
    const [settings, setSettings] = useState({
        esco_api_key: '********-****-****-****-************',
        onet_username: 'ai_architect_user',
        onet_password: '****************',
        lightcast_client_id: 'lc_client_8821',
        lightcast_client_secret: '****************',
        auto_sync: true,
        cache_duration: '24h'
    });

    const handleSave = () => {
        setStatus('saving');
        setTimeout(() => {
            setStatus('success');
            setTimeout(() => setStatus('idle'), 3000);
        }, 1500);
    };

    const testConnection = async (service: 'esco' | 'onet' | 'lightcast') => {
        const setServiceStatus = {
            esco: setEscoStatus,
            onet: setOnetStatus,
            lightcast: setLightcastStatus
        }[service];

        setServiceStatus('testing');

        try {
            const credentials: any = {};
            if (service === 'onet') {
                credentials.username = settings.onet_username;
                credentials.password = settings.onet_password;
            } else if (service === 'lightcast') {
                credentials.clientId = settings.lightcast_client_id;
                credentials.clientSecret = settings.lightcast_client_secret;
            }

            const response = await fetch('http://localhost:3000/test-connection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    service,
                    credentials
                })
            });

            const data = await response.json();
            setServiceStatus(data.success ? 'success' : 'error');

            if (data.success) {
                setTimeout(() => setServiceStatus('idle'), 5000);
            }
        } catch (error) {
            console.error('Connection test failed', error);
            setServiceStatus('error');
        }
    };

    const StatusBadge = ({ status }: { status: ConnectionStatus }) => {
        if (status === 'idle') return null;

        const configs = {
            testing: { icon: RefreshCw, text: 'Testing...', color: 'text-sky-400', bg: 'bg-sky-500/10', animate: 'animate-spin' },
            success: { icon: CheckCircle2, text: 'Connected', color: 'text-emerald-400', bg: 'bg-emerald-500/10', animate: '' },
            error: { icon: XCircle, text: 'Failed', color: 'text-red-400', bg: 'bg-red-500/10', animate: '' }
        }[status];

        const Icon = configs.icon;

        return (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${configs.bg} ${configs.color} text-[10px] font-bold uppercase tracking-wider transition-all animate-in fade-in zoom-in duration-300`}>
                <Icon className={`w-3 h-3 ${configs.animate}`} />
                <span>{configs.text}</span>
            </div>
        );
    };

    return (
        <div className="h-screen flex overflow-hidden galaxy-root text-slate-400 bg-[#0B1120]">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-500/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full"></div>
            </div>

            {/* ===== SIDEBAR ===== */}
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
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/10 border border-white/10 text-white font-semibold transition-all text-[11px]"
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
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="ค้นหาอาชีพ..."
                                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 transition-colors"
                            />
                        </div>

                        <Link to="/galaxy" className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-800/30 border border-slate-700/30 text-xs text-slate-400 hover:text-sky-400 hover:border-sky-500/30 transition-all">
                            <span>Back to Galaxy</span>
                        </Link>

                        {/* Categories */}
                        <div>
                            <h3 className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
                                Categories ({STATS.totalCategories})
                            </h3>
                            <ul className="space-y-1">
                                {CATEGORIES.map((cat) => (
                                    <li key={cat.id}>
                                        <Link
                                            to={`/category/${cat.id}`}
                                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-all"
                                        >
                                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
                                            <span className="text-[11px] text-slate-300 flex-1 truncate">{cat.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </nav>

                    {/* User */}
                    <div className="p-3 border-t border-slate-800/50 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-medium text-slate-300 truncate">{user?.name || 'User'}</p>
                            </div>
                            <button onClick={logout} className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors" title="ออกจากระบบ">
                                <LogOut className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ===== MAIN CONTENT ===== */}
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

                {/* Top bar */}
                <div className="h-12 flex items-center justify-between px-6 z-40 border-b border-slate-800/30 bg-[#0B1120]/80 backdrop-blur shrink-0">
                    <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-sky-500" />
                        <h1 className="text-sm font-bold text-slate-200 tracking-tight">System Settings</h1>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={status === 'saving'}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold text-[11px] transition-all shadow-lg shadow-sky-500/20 active:scale-95"
                    >
                        {status === 'saving' ? (
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : status === 'success' ? (
                            <CheckCircle2 className="w-3 h-3" />
                        ) : (
                            <Save className="w-3.5 h-3.5" />
                        )}
                        {status === 'saving' ? 'Saving...' : status === 'success' ? 'Saved' : 'Save Changes'}
                    </button>
                </div>

                {/* Scrollable Form Area */}
                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    <div className="max-w-3xl mx-auto space-y-8 pb-12">
                        {/* Header Info */}
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight mb-1">Configuration</h2>
                            <p className="text-xs text-slate-500">Manage your data sources and API integrations for the skills harvesting engine.</p>
                        </div>

                        <div className="grid gap-6">
                            {/* ESCO Configuration */}
                            <section className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                            <Globe className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white">ESCO Integration</h3>
                                            <p className="text-[10px] text-slate-500 leading-none mt-1">European Skills & Competencies</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <StatusBadge status={escoStatus} />
                                        <button
                                            onClick={() => testConnection('esco')}
                                            disabled={escoStatus === 'testing'}
                                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <RefreshCw className={`w-3 h-3 ${escoStatus === 'testing' ? 'animate-spin' : ''}`} />
                                            Test Connection
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">API Endpoint</label>
                                        <input
                                            type="text"
                                            defaultValue="https://ec.europa.eu/esco/api"
                                            className="w-full px-4 py-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-500/50 transition-all font-mono"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">API Key / Token</label>
                                        <input
                                            type="password"
                                            value={settings.esco_api_key}
                                            onChange={(e) => setSettings({ ...settings, esco_api_key: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-500/50 transition-all font-mono"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* O*NET Configuration */}
                            <section className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                            <Database className="w-4 h-4 text-amber-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white">O*NET Web Services</h3>
                                            <p className="text-[10px] text-slate-500 leading-none mt-1">Occupational Information Network</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <StatusBadge status={onetStatus} />
                                        <button
                                            onClick={() => testConnection('onet')}
                                            disabled={onetStatus === 'testing'}
                                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <RefreshCw className={`w-3 h-3 ${onetStatus === 'testing' ? 'animate-spin' : ''}`} />
                                            Test Connection
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Username</label>
                                        <input
                                            type="text"
                                            value={settings.onet_username}
                                            onChange={(e) => setSettings({ ...settings, onet_username: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-500/50 transition-all"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Password</label>
                                        <input
                                            type="password"
                                            value={settings.onet_password}
                                            onChange={(e) => setSettings({ ...settings, onet_password: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-500/50 transition-all font-mono"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Lightcast Configuration */}
                            <section className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                                            <Cloud className="w-4 h-4 text-sky-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white">Lightcast</h3>
                                            <p className="text-[10px] text-slate-500 leading-none mt-1">Global Skills Taxonomy</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <StatusBadge status={lightcastStatus} />
                                        <button
                                            onClick={() => testConnection('lightcast')}
                                            disabled={lightcastStatus === 'testing'}
                                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <RefreshCw className={`w-3 h-3 ${lightcastStatus === 'testing' ? 'animate-spin' : ''}`} />
                                            Test Connection
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Client ID</label>
                                            <input
                                                type="text"
                                                value={settings.lightcast_client_id}
                                                onChange={(e) => setSettings({ ...settings, lightcast_client_id: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-500/50 transition-all font-mono"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Client Secret</label>
                                            <input
                                                type="password"
                                                value={settings.lightcast_client_secret}
                                                onChange={(e) => setSettings({ ...settings, lightcast_client_secret: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-500/50 transition-all font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Preferences */}
                            <section className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                        <Settings className="w-4 h-4 text-violet-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">System Preferences</h3>
                                        <p className="text-[10px] text-slate-500 leading-none mt-1">Caching and Syncing</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/30 border border-slate-800/50">
                                        <div>
                                            <p className="text-xs font-semibold text-white">Background Sync</p>
                                            <p className="text-[10px] text-slate-500">Auto-update data from sources</p>
                                        </div>
                                        <button
                                            onClick={() => setSettings({ ...settings, auto_sync: !settings.auto_sync })}
                                            className={`w-10 h-5 rounded-full transition-all relative ${settings.auto_sync ? 'bg-sky-500' : 'bg-slate-700'}`}
                                        >
                                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${settings.auto_sync ? 'left-5' : 'left-1'}`}></div>
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Data Cache Duration</label>
                                        <div className="flex gap-2">
                                            {['6h', '12h', '24h', '7d'].map((time) => (
                                                <button
                                                    key={time}
                                                    onClick={() => setSettings({ ...settings, cache_duration: time })}
                                                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${settings.cache_duration === time ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="p-5 rounded-xl border border-sky-500/20 bg-sky-500/5 flex items-start gap-4">
                            <AlertCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                <span className="text-sky-400 font-bold uppercase mr-1">Note:</span>
                                These settings are stored locally in the environment configuration and are shared across the Generator Service.
                                Make sure your credentials have the necessary permissions for data harvesting.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
