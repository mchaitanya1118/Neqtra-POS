import { create } from 'zustand';
import { API_URL } from '@/lib/config';

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
            const res = await fetch(`${API_URL}/delivery`);
            if (!res.ok) throw new Error('Failed to fetch deliveries');
            const data = await res.json();
            set({ deliveries: data, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    updateDelivery: async (id, data) => {
        try {
            const res = await fetch(`${API_URL}/delivery/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update delivery');
            const updated = await res.json();
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
            const res = await fetch(`${API_URL}/delivery/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete delivery');
            set((state) => ({
                deliveries: state.deliveries.filter((d) => d.id !== id),
            }));
        } catch (err: any) {
            set({ error: err.message });
            throw err;
        }
    },
}));
