import { io } from 'socket.io-client';

let socketInstance = null;

const resolveSocketBaseUrl = () => {
  const configuredApiBase = String(import.meta.env.VITE_API_BASE_URL || '').trim();
  if (!configuredApiBase) return undefined;

  const normalized = configuredApiBase.replace(/\/+$/, '');
  return normalized.endsWith('/api') ? normalized.slice(0, -4) : normalized;
};

export const getSocket = () => {
  if (socketInstance) return socketInstance;

  const baseUrl = resolveSocketBaseUrl();
  socketInstance = io(baseUrl, {
    autoConnect: false,
    withCredentials: true,
    transports: ['websocket', 'polling'],
  });

  return socketInstance;
};
