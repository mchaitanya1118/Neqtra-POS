import { X, Search, Users } from 'lucide-react';
import { useTableStore } from '@/store/useTableStore';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface TableSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (tableId: number) => void;
    title?: string;
    filter?: 'ALL' | 'FREE' | 'OCCUPIED';
    currentTableId?: number;
}

export function TableSelectionModal({ isOpen, onClose, onSelect, title = "Select Table", filter = 'ALL', currentTableId }: TableSelectionModalProps) {
    const { tables } = useTableStore();
    const [search, setSearch] = useState("");

    const filteredTables = useMemo(() => {
        return tables.filter(t => {
            const matchesSearch = t.label.toLowerCase().includes(search.toLowerCase());
            const matchesFilter = filter === 'ALL' ? true : t.status === filter;
            const notCurrent = t.id !== currentTableId;
            return matchesSearch && matchesFilter && notCurrent;
        });
    }, [tables, search, filter, currentTableId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div
                className="bg-surface rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-surface-light"
            >
                {/* Header */}
                <div className="p-6 border-b border-surface-light flex justify-between items-center bg-surface">
                    <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-surface-light rounded-full transition-colors text-muted hover:text-foreground">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-6 border-b border-surface-light">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                        <input
                            className="w-full pl-12 pr-4 py-3 bg-surface-light border border-transparent rounded-[20px] text-sm focus:border-primary focus:bg-surface focus:ring-0 outline-none transition-all placeholder:text-muted/60 font-medium"
                            placeholder="Search tables..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-3 sm:grid-cols-4 gap-4 bg-background/50 custom-scrollbar">
                    {filteredTables.map(table => (
                        <button
                            key={table.id}
                            onClick={() => onSelect(table.id)}
                            className={cn(
                                "p-6 rounded-[24px] border flex flex-col items-center gap-3 transition-all hover:scale-[1.05] active:scale-[0.98]",
                                table.status === 'OCCUPIED'
                                    ? "bg-surface-light border-primary/30 text-primary shadow-[0_0_15px_rgba(105,215,189,0.15)]"
                                    : "bg-surface-light border-surface-light text-muted hover:border-primary/50 hover:text-foreground hover:shadow-lg hover:shadow-primary/10"
                            )}
                        >
                            <span className="text-2xl font-bold tracking-tight">{table.label}</span>
                            <div className="flex items-center gap-1.5 text-xs font-medium opacity-80">
                                <Users className="w-3 h-3" />
                                <span>{table.capacity}</span>
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider",
                                table.status === 'OCCUPIED' ? "bg-primary text-primary-fg" : "bg-surface text-muted"
                            )}>
                                {table.status}
                            </span>
                        </button>
                    ))}
                    {filteredTables.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted text-sm font-medium">
                            No matching tables found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
