import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { API_URL } from '@/lib/config';

interface Item {
    id: number;
    title: string;
    price: number;
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
}

export const useMenuStore = create<MenuState>()(
    persist(
        (set, get) => ({
            categories: [],
            isLoading: false,
            fetchMenu: async () => {
                const state = get();
                if (state.isLoading) return;
                // If we already have categories, don't refetch automatically unless forced (future improvement)
                // For now, just deduplicate inflight

                set({ isLoading: true });
                try {
                    const res = await fetch(`${API_URL}/menu/categories`);
                    if (!res.ok) throw new Error("Failed to fetch menu");

                    const data = await res.json();
                    const mapped = data.map((c: any) => ({
                        ...c,
                        // We'll handle icon mapping in the component or store strings here
                        icon: c.icon || 'Coffee',
                        variant: c.variant || 'mint'
                    }));
                    set({ categories: mapped, isLoading: false });
                } catch (e) {
                    console.error("Failed to fetch menu (offline?):", e);
                    set({ isLoading: false });
                }
            },
        }),
        {
            name: 'neqtra-menu',
        }
    )
);
