"use client";

// @ts-ignore
import { Grid } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import { useCartStore } from "@/store/useCartStore";
import { memo } from 'react';
import { cn } from "@/lib/utils";

interface VirtualProductGridProps {
    items: any[];
    onAddItem: (item: any) => void;
}

// Memoized Cell Component
const Cell = memo(({ columnIndex, rowIndex, style, data }: any) => {
    const { items, columnCount, onAddItem, cartItems } = data;
    const index = rowIndex * columnCount + columnIndex;

    if (index >= items.length) return null;

    const item = items[index];
    const inCart = cartItems.find((i: any) => i.menuItemId === item.id);

    return (
        <div style={{ ...style, padding: '4px' }}>
            <button
                onClick={() => onAddItem(item)}
                className="w-full h-full bg-white dark:bg-[#333] border-l-4 border-l-green-500 rounded-r-md shadow-sm p-3 flex flex-col items-start justify-between hover:shadow-md transition-shadow active:scale-[0.98] group relative overflow-hidden"
            >
                <div className="w-full">
                    <span className="font-semibold text-gray-800 dark:text-gray-100 text-xs md:text-sm text-left line-clamp-2 leading-tight w-full block">
                        {item.title}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-1 block text-left">
                        ₹{item.price}
                    </span>
                </div>

                {inCart && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm">
                        {inCart.quantity}
                    </div>
                )}
            </button>
        </div>
    );
});

Cell.displayName = 'VirtualCell';

export function VirtualProductGrid({ items, onAddItem }: VirtualProductGridProps) {
    const { items: cartItems } = useCartStore();

    return (
        <div className="flex-1 w-full h-full min-h-[400px]">
            <AutoSizer renderProp={({ height, width }: { height?: number; width?: number }) => {
                if (width === undefined || height === undefined) return null;

                // Responsive Column Logic
                // Base target width for a card ~180px - 200px
                let columnCount = Math.floor(width / 180);

                // Constraints
                if (columnCount < 2) columnCount = 2; // Always at least 2 columns (even on mobile, usually looks better small)
                if (width < 350) columnCount = 1; // Very small devices

                const rowCount = Math.ceil(items.length / columnCount);
                const columnWidth = width / columnCount;
                const rowHeight = 100; // Fixed height approx

                return (
                    // @ts-ignore
                    <Grid
                        columnCount={columnCount}
                        columnWidth={columnWidth}
                        height={height}
                        rowCount={rowCount}
                        rowHeight={rowHeight}
                        width={width}
                        cellProps={{
                            data: {
                                items,
                                columnCount,
                                onAddItem,
                                cartItems
                            }
                        }}
                        cellComponent={Cell}
                        className="no-scrollbar"
                    />
                );
            }}
            />
        </div >
    );
}
