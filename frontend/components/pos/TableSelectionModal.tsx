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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div
                className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-800/50">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-100 dark:border-zinc-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-zinc-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Search tables..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 sm:grid-cols-4 gap-3 bg-gray-50/30 dark:bg-black/20">
                    {filteredTables.map(table => (
                        <button
                            key={table.id}
                            onClick={() => onSelect(table.id)}
                            className={cn(
                                "p-4 rounded-xl border flex flex-col items-center gap-2 transition-all hover:scale-[1.02]",
                                table.status === 'OCCUPIED'
                                    ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
                                    : "bg-white border-gray-200 text-gray-700 hover:border-green-400 hover:shadow-md dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-200"
                            )}
                        >
                            <span className="text-lg font-bold">{table.label}</span>
                            <div className="flex items-center gap-1 text-xs opacity-70">
                                <Users className="w-3 h-3" />
                                <span>{table.capacity}</span>
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                table.status === 'OCCUPIED' ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                            )}>
                                {table.status}
                            </span>
                        </button>
                    ))}
                    {filteredTables.length === 0 && (
                        <div className="col-span-full py-8 text-center text-gray-400 text-sm">
                            No matching tables found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
