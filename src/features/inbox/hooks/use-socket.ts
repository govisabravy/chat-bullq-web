'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import type { Socket } from 'socket.io-client';

/**
 * Singleton socket handle. We also track the currently-joined conversation
 * room in module scope so the `connect` listener (fired on every reconnect)
 * can rejoin automatically — otherwise a transient websocket drop leaves the
 * client outside its conversation room and realtime events go silent.
 */
let activeConversationId: string | null = null;

function setActiveConversation(id: string | null) {
  activeConversationId = id;
}

function getActiveConversation(): string | null {
  return activeConversationId;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    // On every (re)connect, rejoin the active conversation room.
    const rejoin = () => {
      const convId = getActiveConversation();
      if (convId) socket.emit('join:conversation', { conversationId: convId });
    };
    socket.on('connect', rejoin);
    if (socket.connected) rejoin();

    return () => {
      socket.off('connect', rejoin);
    };
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  const emit = useCallback((event: string, data: any) => {
    const socket = socketRef.current;
    if (!socket) return;
    // Track join/leave to support auto-rejoin across reconnects.
    if (event === 'join:conversation') {
      setActiveConversation(data?.conversationId ?? null);
    }
    if (event === 'leave:conversation') {
      if (getActiveConversation() === data?.conversationId) {
        setActiveConversation(null);
      }
    }
    socket.emit(event, data);
  }, []);

  return { on, emit, socket: socketRef };
}
