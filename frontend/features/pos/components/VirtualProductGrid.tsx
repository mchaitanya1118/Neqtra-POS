"use client";

import { useCartStore } from "@/store/useCartStore";
import { memo, useMemo } from 'react';
import { cn } from "@/lib/utils";
import { FixedSizeGrid as Grid } from "react-window";
import AutoSizer from 'react-virtualized-auto-sizer';
import Image from 'next/image';

interface VirtualProductGridProps {
    items: any[];
    onAddItem: (item: any) => void;
}

const ProductCard = memo(({ item, onAddItem, quantity }: any) => {
    return (
        <button
            onPointerDown={(e) => {
                // Prevent default to avoid double-firing with onClick on touch devices
                e.preventDefault();
                onAddItem(item);
            }}
            // Fallback for keyboard accessibility
            onClick={() => onAddItem(item)}
            className={cn(
                "w-full h-full rounded-[24px] p-0 flex flex-col items-start justify-between transition-all duration-300 relative overflow-hidden group border active:scale-[0.97]",
                quantity > 0
                    ? "bg-primary/20 border-primary shadow-[0_0_20px_rgba(105,215,189,0.15)]"
                    : "bg-surface/20 border-surface-light hover:border-primary/30 hover:bg-surface/40 shadow-sm"
            )}
            style={{ width: 'calc(100% - 16px)', height: 'calc(100% - 16px)', margin: '8px' }} // Manual gutter
        >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            {/* Image Placeholder or Image */}
            <div className="w-full h-24 relative bg-surface-light/30 overflow-hidden">
                {item.imageUrl ? (
                    <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <span className="font-serif italic text-xs tracking-widest uppercase">Neqtra</span>
                    </div>
                )}
                {quantity > 0 && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-fg text-[10px] h-6 px-2 flex items-center justify-center rounded-full font-bold shadow-lg z-20">
                        {quantity}x
                    </div>
                )}
            </div>

            <div className="p-3 w-full flex-1 flex flex-col justify-between relative z-10">
                <div className="flex flex-col items-start text-left">
                    <span className="text-[8px] font-bold text-muted uppercase tracking-[0.2em] mb-0.5 group-hover:text-primary transition-colors">
                        {item.categoryTitle || 'Registry Item'}
                    </span>
                    <h3 className="font-bold text-foreground text-[13px] line-clamp-1 leading-tight w-full font-serif italic tracking-tight group-hover:translate-x-1 transition-transform">
                        {item.title}
                    </h3>
                </div>

                <div className="w-full flex items-center justify-between mt-1">
                    <span className="text-[13px] font-bold text-primary">
                        ₹{Math.round(item.price)}
                    </span>

                    <div className="w-6 h-6 rounded-full border border-surface-light flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all">
                        <span className="text-muted group-hover:text-primary-fg text-base font-light leading-none">+</span>
                    </div>
                </div>
            </div>
        </button>
    );
});

ProductCard.displayName = 'ProductCard';

export const VirtualProductGrid = memo(function VirtualProductGrid({ items, onAddItem }: VirtualProductGridProps) {
    const { items: cartItems } = useCartStore();

    // Optimize quantity lookup to O(1) in the render loop
    const quantityMap = useMemo(() => {
        const map: Record<number, number> = {};
        cartItems.forEach(item => {
            map[item.menuItemId] = item.quantity;
        });
        return map;
    }, [cartItems]);

    return (
        <div className="flex-1 w-full h-full min-h-0 bg-transparent overflow-hidden">
            <AutoSizer>
                {({ height, width }: { height: number; width: number }) => {
                    if (!width || !height) {
                        return null;
                    }

                    // Responsive column count
                    const columnWidth = width < 640 ? width / 2 : width < 1024 ? width / 3 : width < 1280 ? width / 4 : width / 5;
                    const columnCount = Math.floor(width / columnWidth) || 1; // Prevent 0
                    const rowCount = Math.ceil(items.length / columnCount);

                    return (
                        <Grid
                            columnCount={columnCount}
                            columnWidth={width / columnCount}
                            height={height}
                            rowCount={rowCount}
                            rowHeight={180} // Fixed height for cards
                            width={width}
                            className="custom-scrollbar"
                            style={{ overflowX: 'hidden' }}
                        >
                            {({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => {
                                const index = rowIndex * columnCount + columnIndex;
                                if (index >= items.length) return null;
                                const item = items[index];

                                return (
                                    <div style={style} className="p-2">
                                        {/* p-2 acts as gutter since style has absolute positioning */}
                                        <ProductCard
                                            item={item}
                                            onAddItem={onAddItem}
                                            quantity={quantityMap[item.id] || 0}
                                        />
                                    </div>
                                );
                            }}
                        </Grid>
                    );
                }}
            </AutoSizer>
        </div>
    );
});
