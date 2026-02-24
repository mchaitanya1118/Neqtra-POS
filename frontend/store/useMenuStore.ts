import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/lib/api';

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
                    const res = await apiClient.get('/menu/categories');
                    const data = res.data;
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
                try {
                    await apiClient.post('/menu/categories', { title, icon, variant });
                    await get().fetchMenu();
                } catch (e) { console.error(e); }
            },

            updateCategory: async (id, data) => {
                try {
                    await apiClient.patch(`/menu/categories/${id}`, data);
                    await get().fetchMenu();
                } catch (e) { console.error(e); }
            },

            deleteCategory: async (id) => {
                try {
                    await apiClient.delete(`/menu/categories/${id}`);
                    await get().fetchMenu();
                } catch (e) { console.error(e); }
            },

            addItem: async (categoryId, data) => {
                try {
                    await apiClient.post('/menu/items', { ...data, categoryId });
                    await get().fetchMenu();
                } catch (e) { console.error(e); }
            },

            updateItem: async (id, data) => {
                try {
                    await apiClient.patch(`/menu/items/${id}`, data);
                    await get().fetchMenu();
                } catch (e) { console.error(e); }
            },

            deleteItem: async (id) => {
                try {
                    await apiClient.delete(`/menu/items/${id}`);
                    await get().fetchMenu();
                } catch (e) { console.error(e); }
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
