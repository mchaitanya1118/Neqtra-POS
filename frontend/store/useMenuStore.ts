import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { API_URL } from '@/lib/config';

interface Item {
    id: number;
    title: string;
    price: number;
    description?: string;
    imageUrl?: string;
    isAvailable?: boolean;
    isVegetarian?: boolean;
    isSpicy?: boolean;
    upsellItems?: Item[];
}

interface Category {
    id: number;
    title: string;
    icon: string;
    variant: string;
    items: Item[];
}

interface MenuState {
    categories: Category[];
    isLoading: boolean;
    fetchMenu: () => Promise<void>;
    addCategory: (title: string, icon: string, variant: string) => Promise<void>;
    updateCategory: (id: number, data: Partial<Category>) => Promise<void>;
    deleteCategory: (id: number) => Promise<void>;
    addItem: (categoryId: number, data: any) => Promise<void>;
    updateItem: (id: number, data: any) => Promise<void>;
    deleteItem: (id: number) => Promise<void>;
}

export const useMenuStore = create<MenuState>()(
    persist(
        (set, get) => ({
            categories: [],
            isLoading: false,
            fetchMenu: async () => {
                set({ isLoading: true });
                try {
                    const res = await fetch(`${API_URL}/menu/categories`);
                    if (!res.ok) throw new Error("Failed to fetch menu");

                    const data = await res.json();
                    const mapped = data.map((c: any) => ({
                        ...c,
                        icon: c.icon || 'Coffee',
                        variant: c.variant || 'mint',
                        items: c.items || []
                    }));
                    set({ categories: mapped, isLoading: false });
                } catch (e) {
                    console.error("Failed to fetch menu:", e);
                    set({ isLoading: false });
                }
            },

            addCategory: async (title, icon, variant) => {
                const res = await fetch(`${API_URL}/menu/categories`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, icon, variant })
                });
                if (res.ok) await get().fetchMenu();
            },

            updateCategory: async (id, data) => {
                const res = await fetch(`${API_URL}/menu/categories/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (res.ok) await get().fetchMenu();
            },

            deleteCategory: async (id) => {
                const res = await fetch(`${API_URL}/menu/categories/${id}`, { method: 'DELETE' });
                if (res.ok) await get().fetchMenu();
            },

            addItem: async (categoryId, data) => {
                const res = await fetch(`${API_URL}/menu/items`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...data, categoryId })
                });
                if (res.ok) await get().fetchMenu();
            },

            updateItem: async (id, data) => {
                const res = await fetch(`${API_URL}/menu/items/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (res.ok) await get().fetchMenu();
            },

            deleteItem: async (id) => {
                const res = await fetch(`${API_URL}/menu/items/${id}`, { method: 'DELETE' });
                if (res.ok) await get().fetchMenu();
            },
        }),
        {
            name: 'neqtra-menu',
            version: 2, // Force invalidation
            migrate: (persistedState: any, version: number) => {
                if (version < 2) {
                    return { categories: [], isLoading: false };
                }
                return persistedState;
            },
        }
    )
);
