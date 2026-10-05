import axios from 'axios';

const configuredApiBase = String(import.meta.env.VITE_API_BASE_URL || '').trim();
const normalizedApiBase = configuredApiBase.replace(/\/+$/, '');
const resolvedBaseURL = normalizedApiBase
  ? (normalizedApiBase.endsWith('/api') ? normalizedApiBase : `${normalizedApiBase}/api`)
  : '/api';

const safeStorageGet = (key) => {
  try {
    // Auth token is persisted in sessionStorage; fallback to localStorage for compatibility.
    return sessionStorage.getItem(key) || localStorage.getItem(key);
  } catch {
    return null;
  }
};

const api = axios.create({
  baseURL: resolvedBaseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 12000,
});

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = safeStorageGet('soldyToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const message = String(err?.response?.data?.message || '').toLowerCase();

    if (status === 401 && message.includes('token')) {
      try {
        sessionStorage.removeItem('soldyToken');
        sessionStorage.removeItem('soldyUser');
        localStorage.removeItem('soldyToken');
        localStorage.removeItem('soldyUser');
      } catch {
        // ignore storage errors
      }
    }

    return Promise.reject(err);
  }
);

export default api;
