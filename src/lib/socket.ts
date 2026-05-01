import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let cachedToken: string | null = null;
let cachedOrgId: string | null = null;

export function getSocket(): Socket {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const orgId = typeof window !== 'undefined' ? localStorage.getItem('active_org_id') : null;

  if (socket && cachedToken === token && cachedOrgId === orgId) return socket;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  cachedToken = token;
  cachedOrgId = orgId;

  const url = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';

  socket = io(url, {
    auth: { token, organizationId: orgId },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    (window as any).__socket = socket;
    socket.on('connect', () => console.log('[ws] connected', socket?.id));
    socket.on('connect_error', (e) => console.warn('[ws] connect_error', e.message));
    socket.on('disconnect', (r) => console.warn('[ws] disconnect', r));
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    cachedToken = null;
    cachedOrgId = null;
  }
}
