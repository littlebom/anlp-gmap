import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// JWT interceptor
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
  me: () => api.get('/auth/me'),
};

// Generator API
export const generatorApi = {
  generate: (jobTitle: string) =>
    api.post('/generator/generate', { jobTitle }),
  getJob: (id: string) => api.get(`/generator/jobs/${id}`),
  listJobs: (page = 1, limit = 20) =>
    api.get('/generator/jobs', { params: { page, limit } }),
  curatorEdit: (id: string, data: { courses: any[]; dependencies?: any[] }) =>
    api.patch(`/generator/jobs/${id}/courses`, data),
  publish: (id: string, jobGroupId?: string) =>
    api.post(`/generator/jobs/${id}/publish`, { jobGroupId }),
};

// Settings API
export const settingsApi = {
  getAll: () => api.get('/settings'),
  update: (settings: { key: string; value: string }[]) =>
    api.put('/settings', { settings }),
  test: (provider: string, config: Record<string, string>) =>
    api.post('/settings/test', { provider, config }),
};

// ESCO API
export const escoApi = {
  getGroups: (parentId?: string) =>
    api.get('/esco/groups', { params: { parentId } }),
  getOccupations: (iscoGroupId?: string, page = 1) =>
    api.get('/esco/occupations', { params: { iscoGroupId, page } }),
  getStats: () => api.get('/esco/stats'),
  searchOccupation: (keyword: string) =>
    api.get('/esco/api/search', { params: { keyword } }),
};
