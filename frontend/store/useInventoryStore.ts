import { create } from 'zustand';
import { API_URL } from '@/lib/config';

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
            const res = await fetch(`${API_URL}/inventory`);
            if (!res.ok) throw new Error('Failed to fetch inventory');
            const data = await res.json();
            set({ items: data, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    addItem: async (item) => {
        try {
            const res = await fetch(`${API_URL}/inventory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item),
            });
            if (!res.ok) throw new Error('Failed to add item');
            await get().fetchInventory();
        } catch (err: any) {
            set({ error: err.message });
            throw err;
        }
    },

    updateItem: async (id, data) => {
        try {
            const res = await fetch(`${API_URL}/inventory/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update item');
            await get().fetchInventory();
        } catch (err: any) {
            set({ error: err.message });
            throw err;
        }
    },

    deleteItem: async (id) => {
        try {
            const res = await fetch(`${API_URL}/inventory/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete item');
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
