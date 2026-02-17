import { create } from 'zustand';
import { authApi } from '../lib/api';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;

    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: JSON.parse(localStorage.getItem('anlp_user') || 'null'),
    token: localStorage.getItem('anlp_token'),
    isLoading: false,
    error: null,

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const res = await authApi.login({ email, password });
            const { token, user } = res.data;
            localStorage.setItem('anlp_token', token);
            localStorage.setItem('anlp_user', JSON.stringify(user));
            set({ user, token, isLoading: false });
        } catch (err: any) {
            const msg = err.response?.data?.error || 'เข้าสู่ระบบไม่สำเร็จ';
            set({ error: msg, isLoading: false });
            throw new Error(msg);
        }
    },

    register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
            await authApi.register({ name, email, password });
            set({ isLoading: false });
        } catch (err: any) {
            const msg = err.response?.data?.error || 'สมัครสมาชิกไม่สำเร็จ';
            set({ error: msg, isLoading: false });
            throw new Error(msg);
        }
    },

    logout: () => {
        localStorage.removeItem('anlp_token');
        localStorage.removeItem('anlp_user');
        set({ user: null, token: null });
    },

    checkAuth: async () => {
        const token = localStorage.getItem('anlp_token');
        if (!token) return;
        try {
            const res = await authApi.getMe();
            set({ user: res.data.user, token });
        } catch {
            localStorage.removeItem('anlp_token');
            localStorage.removeItem('anlp_user');
            set({ user: null, token: null });
        }
    },

    clearError: () => set({ error: null }),
}));
