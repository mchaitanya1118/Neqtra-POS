"use client";

import { useCartStore } from "@/store/useCartStore";
import { memo } from 'react';
import { cn } from "@/lib/utils";

interface VirtualProductGridProps {
    items: any[];
    onAddItem: (item: any) => void;
}

const ProductCard = memo(({ item, onAddItem, cartItems }: any) => {
    const cartItem = cartItems?.find((i: any) => i.menuItemId === item.id);
    const inCart = !!cartItem;

    return (
        <button
            onClick={() => onAddItem(item)}
            className={cn(
                "w-full h-[160px] rounded-[32px] p-5 flex flex-col items-start justify-between transition-all duration-500 relative overflow-hidden group border active:scale-[0.97]",
                inCart
                    ? "bg-primary/20 border-primary shadow-[0_0_30px_rgba(105,215,189,0.15)]"
                    : "bg-surface/20 border-surface-light hover:border-primary/30 hover:bg-surface/40 shadow-sm"
            )}
        >
            {/* Background Ambient Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="w-full relative z-10 flex flex-col items-start text-left">
                <span className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-2 group-hover:text-primary transition-colors">
                    Registry Item
                </span>
                <h3 className="font-bold text-foreground text-sm md:text-base line-clamp-2 leading-tight w-full font-serif italic tracking-tight group-hover:translate-x-1 transition-transform">
                    {item.title}
                </h3>
            </div>

            <div className="w-full flex items-end justify-between relative z-10 mt-4">
                <span className="text-base font-bold text-primary">
                    ₹{Math.round(item.price)}
                </span>

                {inCart ? (
                    <div className="bg-primary text-primary-fg text-[11px] h-7 px-3 flex items-center justify-center rounded-full font-bold shadow-lg shadow-primary/30 animate-in zoom-in slide-in-from-bottom-2">
                        {cartItem.quantity}x
                    </div>
                ) : (
                    <div className="w-8 h-8 rounded-full border border-surface-light flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all">
                        <span className="text-muted group-hover:text-primary-fg text-lg font-light leading-none">+</span>
                    </div>
                )}
            </div>
        </button>
    );
});

ProductCard.displayName = 'ProductCard';

export function VirtualProductGrid({ items, onAddItem }: VirtualProductGridProps) {
    const { items: cartItems } = useCartStore();

    return (
        <div className="flex-1 w-full h-full overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20">
                {items.map((item) => (
                    <ProductCard
                        key={item.id}
                        item={item}
                        onAddItem={onAddItem}
                        cartItems={cartItems}
                    />
                ))}
            </div>
        </div>
    );
}
