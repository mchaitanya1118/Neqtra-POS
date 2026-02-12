import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { API_URL } from '@/lib/config';

interface Table {
    id: number;
    label: string;
    status: 'FREE' | 'OCCUPIED' | 'RESERVED';
    capacity: number;
}

interface TableState {
    tables: Table[];
    selectedTableId: number | null;
    isLoading: boolean;

    fetchTables: () => Promise<void>;
    selectTable: (id: number | null) => void;
    getSelectedTable: () => Table | undefined;
    updateStatus: (id: number, status: 'FREE' | 'OCCUPIED' | 'RESERVED') => Promise<void>;
}

export const useTableStore = create<TableState>()(
    persist(
        (set, get) => ({
            tables: [],
            selectedTableId: null,
            isLoading: false,

            fetchTables: async () => {
                if (get().isLoading) return; // Deduplicate requests
                set({ isLoading: true });
                try {
                    const res = await fetch(`${API_URL}/tables`);
                    if (!res.ok) throw new Error("Failed to fetch tables");

                    const data = await res.json();

                    if (Array.isArray(data)) {
                        set({ tables: data, isLoading: false });
                    } else {
                        console.error("Fetched tables data is not an array:", data);
                        set({ tables: [], isLoading: false });
                    }
                } catch (e) {
                    console.error(e);
                    set({ isLoading: false });
                }
            },

            selectTable: (id) => set({ selectedTableId: id }),

            getSelectedTable: () => {
                const state = get();
                if (!state.tables || !Array.isArray(state.tables)) return undefined;
                return state.tables.find(t => t.id === state.selectedTableId);
            },

            updateStatus: async (id: number, status: 'FREE' | 'OCCUPIED' | 'RESERVED') => {
                // Optimistic update with safety check
                set(state => ({
                    tables: Array.isArray(state.tables)
                        ? state.tables.map(t => t.id === id ? { ...t, status } : t)
                        : []
                }));

                try {
                    await fetch(`${API_URL}/tables/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status })
                    });
                } catch (e) {
                    console.error("Failed to update status", e);
                    // Revert on failure (could refetch or rollback)
                }
            }
        }),
        {
            name: 'neqtra-tables',
            version: 3, // Increment version to force clear bad state
            migrate: (persistedState: any, version: number) => {
                if (version < 3 || !persistedState || !Array.isArray(persistedState.tables)) {
                    // Reset if version is old or state is corrupted (tables not array)
                    return { tables: [], selectedTableId: null, isLoading: false };
                }
                return persistedState;
            },
        }
    )
);
