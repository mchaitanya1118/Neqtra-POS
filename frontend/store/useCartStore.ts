
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db } from '@/lib/db';
import { useAuthStore } from './useAuthStore';
import { syncService } from '@/services/sync.service';

export interface CartItem {
    id: number;
    menuItemId: number;
    title: string;
    price: number;
    quantity: number;
}

interface CartState {
    items: CartItem[];
    addItem: (item: { id: number; title: string; price: number }) => void;
    removeItem: (id: number) => void;
    updateQuantity: (id: number, quantity: number) => void;
    clearCart: () => void;
    getTotal: () => number;

    // Parked Orders
    parkOrder: (tableName?: string) => Promise<void>;
    restoreOrder: (orderId: number) => Promise<void>;
    placeOrder: (tableName?: string) => Promise<void>;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (product) => set((state) => {
                const existing = state.items.find((i) => i.menuItemId === product.id);
                if (existing) {
                    return {
                        items: state.items.map((i) =>
                            i.menuItemId === product.id ? { ...i, quantity: i.quantity + 1 } : i
                        ),
                    };
                }
                return {
                    items: [...state.items, {
                        menuItemId: product.id,
                        title: product.title,
                        price: product.price,
                        quantity: 1,
                        id: Date.now()
                    }],
                };
            }),

            removeItem: (menuItemId) => set((state) => ({
                items: state.items.filter((i) => i.menuItemId !== menuItemId),
            })),

            updateQuantity: (menuItemId, quantity) => set((state) => {
                if (quantity <= 0) {
                    return {
                        items: state.items.filter((i) => i.menuItemId !== menuItemId),
                    };
                }
                return {
                    items: state.items.map((i) =>
                        i.menuItemId === menuItemId ? { ...i, quantity } : i
                    ),
                };
            }),

            clearCart: () => set({ items: [] }),

            getTotal: () => {
                return get().items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            },

            parkOrder: async (tableName) => {
                const { items, getTotal, clearCart } = get();
                const user = useAuthStore.getState().user;
                if (items.length === 0 || !user || !user.tenantId) return;

                await db.orders.add({
                    tempId: crypto.randomUUID(),
                    items,
                    totalAmount: getTotal(),
                    status: 'PARKED',
                    createdAt: new Date(),
                    tenantId: user.tenantId,
                    tableName: tableName || 'Unknown',
                });
                clearCart();
            },

            restoreOrder: async (orderId) => {
                const order = await db.orders.get(orderId);
                if (order && order.status === 'PARKED') {
                    set({ items: order.items });
                    await db.orders.delete(orderId);
                }
            },

            placeOrder: async (tableName) => {
                const { items, getTotal, clearCart } = get();
                const user = useAuthStore.getState().user;
                if (items.length === 0 || !user || !user.tenantId) return;

                const tempId = crypto.randomUUID();

                // 1. Optimistic Update: Save to local DB with PENDING status
                await db.orders.add({
                    tempId,
                    items: items.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
                    totalAmount: getTotal(),
                    status: 'PENDING',
                    createdAt: new Date(),
                    tenantId: user.tenantId,
                    branchId: user.branchId,
                    tableName: tableName || 'Quick Order',
                });

                clearCart();

                // 2. Trigger immediate background sync
                if (navigator.onLine) {
                    syncService.sync().catch(console.error);
                }
            }
        }),
        {
            name: 'cart-storage', // basic persistence to localStorage for safety
        }
    )
);
