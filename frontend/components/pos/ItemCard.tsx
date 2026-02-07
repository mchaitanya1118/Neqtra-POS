import { cn } from "@/lib/utils";
import { Plus, Minus } from "lucide-react";

interface ItemCardProps {
    title: string;
    price: number;
    qty?: number;
    statusLabel?: string; // e.g. "Orders -> Kitchen"
    onAdd?: () => void;
    onRemove?: () => void;
    className?: string; // Add className prop for flexibility
}

export function ItemCard({ title, price, qty = 0, statusLabel = "Orders → Kitchen", onAdd, onRemove, className }: ItemCardProps) {
    return (
        <div className={cn("p-5 rounded-2xl bg-surface-light flex flex-col justify-between min-h-[160px] relative overflow-hidden group border border-transparent hover:border-border/50 transition-all", className)}>
            {/* Status Label */}
            <div className="absolute top-4 left-5 text-[10px] uppercase font-bold tracking-wider text-muted opacity-60">
                {statusLabel}
            </div>

            <div className="mt-6">
                <h3 className="font-bold text-lg leading-tight mb-1">{title}</h3>
                <p className="text-sm text-muted font-medium">${price.toFixed(2)}</p>
            </div>

            <div className="mt-auto flex items-center justify-end gap-3">
                {/* Quantity Controls */}
                <button
                    onClick={onRemove}
                    disabled={qty === 0}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted hover:text-foreground hover:bg-surface disabled:opacity-30 transition-colors"
                >
                    <Minus className="w-4 h-4" />
                </button>

                <span className="font-bold w-4 text-center">{qty}</span>

                <button
                    onClick={onAdd}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted hover:text-foreground hover:bg-surface transition-colors"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
