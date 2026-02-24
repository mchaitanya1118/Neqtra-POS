'use client';

import { TopItem } from '@/services/reports.service';
import { cn } from '@/lib/utils';

interface TopItemsTableProps {
    items: TopItem[];
}

export default function TopItemsTable({ items }: TopItemsTableProps) {
    const maxRevenue = Math.max(...items.map(i => Number(i.revenue)), 1);

    return (
        <div className="overflow-hidden">
            <div className="space-y-6">
                {items.map((item, index) => {
                    const percentage = (Number(item.revenue) / maxRevenue) * 100;
                    return (
                        <div key={index} className="group transition-all duration-300">
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Rank #{index + 1}</p>
                                    <h4 className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{item.name}</h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted font-bold mb-1">{item.quantity} units</p>
                                    <p className="text-sm font-black text-foreground">₹{Number(item.revenue).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="w-full h-1.5 bg-background rounded-full overflow-hidden p-[1px]">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-1000 ease-out delay-300"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
                {items.length === 0 && (
                    <div className="py-12 text-center text-muted border-2 border-dashed border-surface-light rounded-2xl">
                        <p className="text-sm font-bold uppercase tracking-widest">No Sales Data Yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
