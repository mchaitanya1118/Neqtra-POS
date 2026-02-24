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
        <div className={cn("p-5 rounded-[32px] bg-surface-light flex flex-col justify-between min-h-[168px] relative overflow-hidden group border border-transparent hover:border-border/30 transition-all shadow-[0_4px_24px_-12px_rgba(0,0,0,0.5)]", className)}>
            {/* Status Label */}
            <div className="absolute top-5 left-6 text-[10px] uppercase font-bold tracking-widest text-muted/60">
                {statusLabel}
            </div>

            <div className="mt-8 px-1">
                <h3 className="font-bold text-xl leading-tight mb-1 text-foreground tracking-tight">{title}</h3>
                <p className="text-sm text-primary font-medium tracking-wide">${price.toFixed(2)}</p>
            </div>

            <div className="mt-auto flex items-center justify-end gap-2 pr-1 pb-1">
                {/* Quantity Controls */}
                <button
                    onClick={onRemove}
                    disabled={qty === 0}
                    className="w-10 h-10 rounded-full bg-surface border border-border/50 flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-light hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all duration-300"
                >
                    <Minus className="w-5 h-5" />
                </button>

                <span className="font-bold w-6 text-center text-lg">{qty}</span>

                <button
                    onClick={onAdd}
                    className="w-10 h-10 rounded-full bg-primary text-primary-fg flex items-center justify-center shadow-lg shadow-primary/20 hover:brightness-110 hover:scale-105 active:scale-95 transition-all duration-300 transform"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
