import { create } from 'zustand';
import apiClient from '@/lib/api';

export interface Delivery {
    id: number;
    orderId: number;
    driverName?: string;
    driverPhone?: string;
    address: string;
    status: 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';
    deliveryFee: number;
    createdAt: string;
    updatedAt: string;
    order: {
        id: number;
        customer?: { name: string; phone: string };
        totalAmount: number;
        items: any[];
    };
}

interface DeliveryStore {
    deliveries: Delivery[];
    isLoading: boolean;
    error: string | null;
    fetchDeliveries: () => Promise<void>;
    updateDelivery: (id: number, data: Partial<Delivery>) => Promise<void>;
    deleteDelivery: (id: number) => Promise<void>;
}

export const useDeliveryStore = create<DeliveryStore>((set, get) => ({
    deliveries: [],
    isLoading: false,
    error: null,

    fetchDeliveries: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await apiClient.get('/delivery');
            set({ deliveries: res.data, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    updateDelivery: async (id, data) => {
        try {
            const res = await apiClient.patch(`/delivery/${id}`, data);
            const updated = res.data;
            set((state) => ({
                deliveries: state.deliveries.map((d) => (d.id === id ? updated : d)),
            }));
        } catch (err: any) {
            set({ error: err.message });
            throw err;
        }
    },

    deleteDelivery: async (id) => {
        try {
            await apiClient.delete(`/delivery/${id}`);
            set((state) => ({
                deliveries: state.deliveries.filter((d) => d.id !== id),
            }));
        } catch (err: any) {
            set({ error: err.message });
            throw err;
        }
    },
}));
