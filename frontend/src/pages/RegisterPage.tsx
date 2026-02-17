import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { UserPlus, User, Mail, Lock, ShieldCheck, Rocket, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
    const navigate = useNavigate();
    const { register, isLoading, error, clearError } = useAuthStore();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState('');

    const passwordStrength = () => {
        let s = 0;
        if (password.length >= 6) s++;
        if (password.length >= 8) s++;
        if (/[A-Z]/.test(password)) s++;
        if (/[0-9]/.test(password)) s++;
        if (/[^A-Za-z0-9]/.test(password)) s++;
        return s;
    };

    const strengthColor = () => {
        const s = passwordStrength();
        if (s <= 1) return 'bg-red-500';
        if (s <= 2) return 'bg-orange-500';
        if (s <= 3) return 'bg-yellow-500';
        if (s <= 4) return 'bg-green-500';
        return 'bg-teal-400';
    };

    const strengthLabel = () => {
        const s = passwordStrength();
        if (password.length === 0) return '';
        if (s <= 1) return 'อ่อนมาก';
        if (s <= 2) return 'อ่อน';
        if (s <= 3) return 'ปานกลาง';
        if (s <= 4) return 'แข็งแรง';
        return 'แข็งแรงมาก';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setLocalError('');

        if (password !== confirmPassword) {
            setLocalError('รหัสผ่านไม่ตรงกัน');
            return;
        }
        if (password.length < 6) {
            setLocalError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
            return;
        }

        try {
            await register(name, email, password);
            navigate('/login?registered=true');
        } catch {
            // Error handled by store
        }
    };

    const displayError = localError || error;

    return (
        <div className="min-h-screen flex items-center justify-center overflow-hidden relative">
            {/* Background */}
            <div className="fixed inset-0 bg-grid pointer-events-none z-0" />
            <div className="fixed top-1/3 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 blur-[150px] rounded-full pointer-events-none z-0" />
            <div className="fixed bottom-1/3 left-1/4 w-[500px] h-[500px] bg-sky-500/5 blur-[150px] rounded-full pointer-events-none z-0" />

            {/* Card */}
            <div className="relative z-10 w-full max-w-md px-4 fade-in">
                <div className="glass rounded-3xl p-8 shadow-2xl" style={{ animation: 'pulseGlow 4s ease-in-out infinite', '--tw-shadow-color': 'rgba(129,140,248,0.15)' } as any}>
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-xl shadow-indigo-500/20 float mb-4">
                            <UserPlus className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">สมัครสมาชิก</h1>
                        <p className="text-sm text-slate-500 mt-1">สร้างบัญชีเพื่อเข้าสู่ Galaxy แห่งการเรียนรู้</p>
                    </div>

                    {/* Error */}
                    {displayError && (
                        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{displayError}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">ชื่อ-นามสกุล</label>
                            <div className="relative">
                                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="John Doe"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">รหัสผ่าน</label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="อย่างน้อย 6 ตัวอักษร" minLength={6}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all" />
                            </div>
                            {password.length > 0 && (
                                <>
                                    <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all ${strengthColor()}`} style={{ width: `${(passwordStrength() / 5) * 100}%` }} />
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-1">{strengthLabel()}</p>
                                </>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">ยืนยันรหัสผ่าน</label>
                            <div className="relative">
                                <ShieldCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="กรอกรหัสผ่านอีกครั้ง"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all" />
                            </div>
                            {confirmPassword.length > 0 && (
                                <p className={`text-[10px] mt-1 ${password === confirmPassword ? 'text-green-400' : 'text-red-400'}`}>
                                    {password === confirmPassword ? '✓ รหัสผ่านตรงกัน' : '✗ รหัสผ่านไม่ตรงกัน'}
                                </p>
                            )}
                        </div>

                        <button type="submit" disabled={isLoading}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Rocket className="w-4 h-4" />
                            )}
                            {isLoading ? 'กำลังสร้างบัญชี...' : 'สร้างบัญชี'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-slate-800" />
                        <span className="text-[10px] text-slate-600 uppercase tracking-widest">หรือ</span>
                        <div className="flex-1 h-px bg-slate-800" />
                    </div>

                    <p className="text-center text-sm text-slate-500">
                        มีบัญชีอยู่แล้ว?{' '}
                        <Link to="/login" className="text-indigo-400 font-medium hover:underline">
                            เข้าสู่ระบบ
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
