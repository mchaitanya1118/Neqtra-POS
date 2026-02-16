import { cn } from "@/lib/utils";
import { Copy, Coffee, Apple, IceCream, Beer, Wine } from "lucide-react";

type ColorVariant = "mint" | "pink" | "lavender" | "blue" | "cream";

interface CategoryCardProps {
    title: string;
    count: number;
    icon: React.ElementType; // Lucide icon
    variant: ColorVariant;
    onClick?: () => void;
    isActive?: boolean;
}

const colorStyles: Record<ColorVariant, string> = {
    mint: "bg-pastel-mint text-pastel-mint-fg hover:brightness-105",
    pink: "bg-pastel-pink text-pastel-pink-fg hover:brightness-105",
    lavender: "bg-pastel-lavender text-pastel-lavender-fg hover:brightness-105",
    blue: "bg-pastel-blue text-pastel-blue-fg hover:brightness-105",
    cream: "bg-pastel-cream text-pastel-cream-fg hover:brightness-105",
};

export function CategoryCard({ title, count, icon: Icon, variant, onClick, isActive }: CategoryCardProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "p-6 rounded-[32px] flex flex-col items-start justify-between min-h-[150px] w-full transition-all duration-300 active:scale-95 text-left relative overflow-hidden group",
                colorStyles[variant],
                isActive
                    ? "ring-2 ring-primary ring-offset-4 ring-offset-background shadow-[0_0_20px_-5px_var(--primary)]"
                    : "hover:translate-y-[-2px] hover:shadow-lg opacity-80 hover:opacity-100"
            )}
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

            <Icon className="w-7 h-7 mb-3 opacity-90 relative z-10" />
            <div className="relative z-10">
                <h3 className="font-bold text-xl leading-tight tracking-tight">{title}</h3>
                <p className="text-sm opacity-70 font-medium mt-1 tracking-wide">{count} items</p>
            </div>
        </button>
    );
}
