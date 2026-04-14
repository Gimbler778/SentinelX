import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sentinelx_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sentinelx_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// --- API methods ---

export const authAPI = {
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  updateProfile: (data) => api.patch('/auth/profile', data),
};

export const logsAPI = {
  getAll: (params) => api.get('/logs', { params }),
  getById: (id) => api.get(`/logs/${id}`),
  create: (data) => api.post('/logs', data),
  delete: (id) => api.delete(`/logs/${id}`),
  getStats: () => api.get('/logs/stats'),
  stream: () => `${BASE_URL}/logs/stream`, // SSE endpoint
};

export const alertsAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  getById: (id) => api.get(`/alerts/${id}`),
  create: (data) => api.post('/alerts', data),
  acknowledge: (id) => api.patch(`/alerts/${id}/acknowledge`),
  resolve: (id) => api.patch(`/alerts/${id}/resolve`),
  delete: (id) => api.delete(`/alerts/${id}`),
  getStats: () => api.get('/alerts/stats'),
};

export const scansAPI = {
  getAll: (params) => api.get('/scans', { params }),
  getById: (id) => api.get(`/scans/${id}`),
  create: (data) => api.post('/scans', data),
  cancel: (id) => api.patch(`/scans/${id}/cancel`),
  delete: (id) => api.delete(`/scans/${id}`),
  getVulnerabilities: (scanId) => api.get(`/scans/${scanId}/vulnerabilities`),
};

export const monitoringAPI = {
  getStatus: () => api.get('/monitoring/status'),
  getMetrics: () => api.get('/monitoring/metrics'),
  getDashboardStats: () => api.get('/monitoring/dashboard'),
};
