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
                "p-5 rounded-2xl flex flex-col items-start justify-between min-h-[140px] w-full transition-all duration-200 active:scale-95 text-left",
                colorStyles[variant],
                isActive && "ring-2 ring-white ring-offset-2 ring-offset-background"
            )}
        >
            <Icon className="w-6 h-6 mb-2 opacity-80" />
            <div>
                <h3 className="font-bold text-lg leading-tight">{title}</h3>
                <p className="text-sm opacity-70 font-medium mt-1">{count} items</p>
            </div>
        </button>
    );
}
