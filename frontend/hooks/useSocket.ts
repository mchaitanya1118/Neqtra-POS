import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';

export const useSocket = () => {
    const socketRef = useRef<Socket | null>(null);
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        if (!user?.tenantId) return;

        // Initialize socket connection to the 'pos' namespace
        const socket = io(`${SOCKET_URL}/pos`, {
            transports: ['websocket'],
            auth: {
                token: localStorage.getItem('token'),
            },
        });

        socket.on('connect', () => {
            console.log('Connected to POS socket server');
            // Join the tenant-specific room
            socket.emit('join_room', user.tenantId);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from POS socket server');
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
        };
    }, [user?.tenantId]);

    const emit = (event: string, data: any) => {
        socketRef.current?.emit(event, data);
    };

    const on = (event: string, callback: (data: any) => void) => {
        socketRef.current?.on(event, callback);
    };

    const off = (event: string) => {
        socketRef.current?.off(event);
    };

    return { socket: socketRef.current, emit, on, off };
};
