import { create } from 'zustand';
import apiClient from '@/lib/api';

export interface InventoryItem {
    id: number;
    name: string;
    quantity: number;
    unit: string;
    threshold: number;
    price: number;
    supplier?: string;
    createdAt: string;
    updatedAt: string;
}

interface InventoryStore {
    items: InventoryItem[];
    isLoading: boolean;
    error: string | null;
    fetchInventory: () => Promise<void>;
    addItem: (item: Partial<InventoryItem>) => Promise<void>;
    updateItem: (id: number, data: Partial<InventoryItem>) => Promise<void>;
    deleteItem: (id: number) => Promise<void>;
    quickAdjust: (id: number, change: number) => Promise<void>;
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
    items: [],
    isLoading: false,
    error: null,

    fetchInventory: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await apiClient.get('/inventory');
            set({ items: res.data, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    addItem: async (item) => {
        try {
            await apiClient.post('/inventory', item);
            await get().fetchInventory();
        } catch (err: any) {
            set({ error: err.message });
            throw err;
        }
    },

    updateItem: async (id, data) => {
        try {
            await apiClient.patch(`/inventory/${id}`, data);
            await get().fetchInventory();
        } catch (err: any) {
            set({ error: err.message });
            throw err;
        }
    },

    deleteItem: async (id) => {
        try {
            await apiClient.delete(`/inventory/${id}`);
            set((state) => ({
                items: state.items.filter((i) => i.id !== id),
            }));
        } catch (err: any) {
            set({ error: err.message });
            throw err;
        }
    },

    quickAdjust: async (id, change) => {
        const item = get().items.find(i => i.id === id);
        if (!item) return;

        const newQty = Math.max(0, item.quantity + change);
        try {
            await get().updateItem(id, { quantity: newQty });
        } catch (err: any) {
            set({ error: err.message });
        }
    }
}));
