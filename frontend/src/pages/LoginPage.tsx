import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { BrainCircuit, Mail, Lock, LogIn, AlertCircle, CheckCircle } from 'lucide-react';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, isLoading, error, clearError } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [success, setSuccess] = useState('');

    // Check for registration redirect
    const params = new URLSearchParams(window.location.search);
    const registered = params.get('registered');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        try {
            await login(email, password);
            navigate('/galaxy');
        } catch {
            // Error is handled by the store
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center overflow-hidden relative">
            {/* Background */}
            <div className="fixed inset-0 bg-grid pointer-events-none z-0" />
            <div className="fixed top-1/4 left-1/4 w-[600px] h-[600px] bg-sky-500/5 blur-[150px] rounded-full pointer-events-none z-0" />
            <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-500/5 blur-[150px] rounded-full pointer-events-none z-0" />

            {/* Card */}
            <div className="relative z-10 w-full max-w-md px-4 fade-in">
                <div className="glass rounded-3xl p-8 shadow-2xl pulse-glow">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center shadow-xl shadow-sky-500/20 float mb-4">
                            <BrainCircuit className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">AI-Learn Galaxy</h1>
                        <p className="text-sm text-slate-500 mt-1">เข้าสู่ระบบเพื่อเริ่มการเรียนรู้</p>
                    </div>

                    {/* Messages */}
                    {(registered || success) && (
                        <div className="mb-4 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 shrink-0" />
                            <span>{success || 'สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ'}</span>
                        </div>
                    )}
                    {error && (
                        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="you@example.com"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <LogIn className="w-4 h-4" />
                            )}
                            {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-slate-800" />
                        <span className="text-[10px] text-slate-600 uppercase tracking-widest">หรือ</span>
                        <div className="flex-1 h-px bg-slate-800" />
                    </div>

                    {/* Register link */}
                    <p className="text-center text-sm text-slate-500">
                        ยังไม่มีบัญชี?{' '}
                        <Link to="/register" className="text-sky-400 font-medium hover:underline">
                            สมัครสมาชิก
                        </Link>
                    </p>
                </div>

                <p className="text-center text-[10px] text-slate-700 mt-6">
                    ANLP-GSM · AI-Native Adaptive Learning Platform · v2.0
                </p>
            </div>
        </div>
    );
}
