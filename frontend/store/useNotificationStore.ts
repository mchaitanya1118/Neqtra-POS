import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '@/lib/config';

export interface Notification {
    id: number;
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    read: boolean;
    createdAt: string;
}

interface NotificationStore {
    notifications: Notification[];
    unreadCount: number;
    isConnected: boolean;
    isLoading: boolean;
    socket: Socket | null;

    fetchNotifications: () => Promise<void>;
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: number) => Promise<void>;
    clearAll: () => Promise<void>;
    connectSocket: () => void;
    disconnectSocket: () => void;
    addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isConnected: false,
    isLoading: false,
    socket: null,

    fetchNotifications: async () => {
        set({ isLoading: true });
        try {
            const res = await fetch(`${API_URL}/notifications`);
            if (res.ok) {
                const data = await res.json();
                const unreadCount = data.filter((n: Notification) => !n.read).length;
                set({ notifications: data, unreadCount, isLoading: false });
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
            set({ isLoading: false });
        }
    },

    markAsRead: async (id) => {
        try {
            const res = await fetch(`${API_URL}/notifications/${id}/read`, { method: 'PATCH' });
            if (res.ok) {
                set((state) => {
                    const updated = state.notifications.map((n) =>
                        n.id === id ? { ...n, read: true } : n
                    );
                    return {
                        notifications: updated,
                        unreadCount: updated.filter((n) => !n.read).length,
                    };
                });
            }
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    },

    markAllAsRead: async () => {
        try {
            const res = await fetch(`${API_URL}/notifications/read-all`, { method: 'PATCH' });
            if (res.ok) {
                set((state) => ({
                    notifications: state.notifications.map((n) => ({ ...n, read: true })),
                    unreadCount: 0,
                }));
            }
        } catch (error) {
            console.error('Failed to mark all notifications as read', error);
        }
    },

    deleteNotification: async (id) => {
        try {
            const res = await fetch(`${API_URL}/notifications/${id}`, { method: 'DELETE' });
            if (res.ok) {
                set((state) => {
                    const updated = state.notifications.filter((n) => n.id !== id);
                    return {
                        notifications: updated,
                        unreadCount: updated.filter((n) => !n.read).length,
                    };
                });
            }
        } catch (error) {
            console.error('Failed to delete notification', error);
        }
    },

    clearAll: async () => {
        try {
            const res = await fetch(`${API_URL}/notifications`, { method: 'DELETE' });
            if (res.ok) {
                set({ notifications: [], unreadCount: 0 });
            }
        } catch (error) {
            console.error('Failed to clear notifications', error);
        }
    },

    addNotification: (notification) => {
        set((state) => {
            const exists = state.notifications.some(n => n.id === notification.id);
            if (exists) return state; // Avoid duplicates

            const newNotifications = [notification, ...state.notifications].slice(0, 50);
            return {
                notifications: newNotifications,
                unreadCount: newNotifications.filter((n) => !n.read).length,
            };
        });

        // Play sound logic could be here too
        const audio = new Audio('/notification.mp3');
        audio.play().catch(e => console.log('Audio play failed', e));
    },

    connectSocket: () => {
        if (get().socket) return;

        const socket = io(`${API_URL}/notifications`);

        socket.on('connect', () => {
            set({ isConnected: true });
        });

        socket.on('disconnect', () => {
            set({ isConnected: false });
        });

        socket.on('new_notification', (notification: Notification) => {
            get().addNotification(notification);
        });

        set({ socket });
    },

    disconnectSocket: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null, isConnected: false });
        }
    },
}));
