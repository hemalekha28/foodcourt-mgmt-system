import { io } from "socket.io-client";
import { API_BASE_URL } from './api';

const socket = io(API_BASE_URL, {
  // Prefer WebSocket; fall back to polling only if WS is unavailable.
  // This avoids silent failures on hosts that terminate long-polling differently.
  transports: ['websocket', 'polling'],
  // Reconnection settings — keeps the UI reactive after a transient server restart
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,       // 1 s initial delay
  reconnectionDelayMax: 10000,   // cap at 10 s
  timeout: 20000,
  // Don't auto-connect — connect explicitly after the user is authenticated
  // so we don't open unnecessary connections on public pages.
  autoConnect: true,
});

socket.on('connect', () => {
  console.log('🔌 Socket connected:', socket.id);
});

socket.on('connect_error', (err) => {
  console.warn('⚠️  Socket connection error:', err.message);
});

socket.on('disconnect', (reason) => {
  console.warn('⚠️  Socket disconnected:', reason);
});

export default socket;
