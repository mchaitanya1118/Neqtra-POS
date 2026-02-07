import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OrderItem {
    menuItemId: number;
    quantity: number;
}

interface PendingOrder {
    id: string; // Temporary ID
    tableName: string;
    items: OrderItem[];
    timestamp: number;
}

interface OfflineState {
    pendingOrders: PendingOrder[];
    addOrder: (order: Omit<PendingOrder, 'id' | 'timestamp'>) => void;
    removeOrder: (id: string) => void;
    clearQueue: () => void;
}

export const useOfflineStore = create<OfflineState>()(
    persist(
        (set) => ({
            pendingOrders: [],
            addOrder: (order) => set((state) => ({
                pendingOrders: [...state.pendingOrders, {
                    ...order,
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                }]
            })),
            removeOrder: (id) => set((state) => ({
                pendingOrders: state.pendingOrders.filter((o) => o.id !== id)
            })),
            clearQueue: () => set({ pendingOrders: [] }),
        }),
        {
            name: 'neqtra-offline-orders',
        }
    )
);
