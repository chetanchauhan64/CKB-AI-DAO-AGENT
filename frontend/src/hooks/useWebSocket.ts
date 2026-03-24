'use client';

import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppStore } from '@/store';
import type { WebSocketEvent } from '@/store';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

let _socket: Socket | null = null;
let _subscribers = 0;

export function useWebSocket(sessionId = 'default') {
  useEffect(() => {
    // 1. If not connected globally, connect now
    if (!_socket) {
      _socket = io(BACKEND_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1500,
        reconnectionAttempts: Infinity,
      });

      _socket.on('connect', () => {
        useAppStore.getState().setConnected(true);
        _socket!.emit('subscribe', { sessionId });
      });

      _socket.on('disconnect', () => {
        useAppStore.getState().setConnected(false);
      });
    }

    _subscribers++;

    // 2. Attach the specific event listener for this component mount
    const handleEvent = (ev: Omit<WebSocketEvent, 'id'>) => {
      useAppStore.getState().addEvent(ev);
    };

    _socket.on('event', handleEvent);

    // If socket is already live but we just mounted, join the session room
    if (_socket.connected) {
      useAppStore.getState().setConnected(true);
      _socket.emit('subscribe', { sessionId });
    }

    // 3. Cleanup on unmount
    return () => {
      if (_socket) {
        _socket.off('event', handleEvent);
      }
      
      _subscribers--;
      // If no components are listening anymore, close the connection to prevent ghosts
      if (_subscribers === 0 && _socket) {
        _socket.disconnect();
        _socket = null;
        useAppStore.getState().setConnected(false);
      }
    };
  }, [sessionId]);

  return {
    events:      useAppStore((s) => s.events),
    isConnected: useAppStore((s) => s.isConnected),
  };
}

export type { WebSocketEvent } from '@/store';
