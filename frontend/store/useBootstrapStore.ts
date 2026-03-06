import { create } from 'zustand';
import apiClient from '@/lib/api';
import { useMenuStore } from './useMenuStore';
import { useTableStore } from './useTableStore';

interface BootstrapState {
    isBootstrapped: boolean;
    isLoading: boolean;
    error: string | null;
    bootstrap: () => Promise<void>;
}

export const useBootstrapStore = create<BootstrapState>((set, get) => ({
    isBootstrapped: false,
    isLoading: false,
    error: null,
    bootstrap: async () => {
        if (get().isBootstrapped || get().isLoading) return;

        set({ isLoading: true, error: null });
        try {
            const res = await apiClient.get('/pos/bootstrap');
            const { categories, tables } = res.data;

            // Map frontend specific properties
            const mappedCategories = categories.map((c: any) => ({
                ...c,
                icon: c.icon || 'Coffee',
                variant: c.variant || 'mint',
                items: c.items || []
            }));

            // Populate the respective stores
            useMenuStore.setState({ categories: mappedCategories, isLoading: false });
            useTableStore.setState({ tables: tables || [], isLoading: false });

            set({ isBootstrapped: true, isLoading: false });
        } catch (error: any) {
            console.error('Failed to bootstrap POS data:', error);
            set({ error: error.message || 'Failed to initialize POS', isLoading: false });
        }
    }
}));
