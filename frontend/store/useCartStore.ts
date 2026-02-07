import { create } from 'zustand';

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
    placeOrder: () => Promise<void>;
    getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
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
            items: [...state.items, { menuItemId: product.id, title: product.title, price: product.price, quantity: 1, id: Date.now() }],
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

    placeOrder: async () => {
        // To be implemented
    }
}));
