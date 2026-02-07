import { useState, useEffect } from "react";
import { X, Search, UserPlus, Check } from "lucide-react";
import { API_URL } from "@/lib/config";

interface Customer {
    id: number;
    name: string;
    phone: string;
    email?: string;
}

interface CustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (customer: Customer) => void;
}

export function CustomerModal({ isOpen, onClose, onSelect }: CustomerModalProps) {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState("");
    const [view, setView] = useState<'LIST' | 'CREATE'>('LIST');
    const [loading, setLoading] = useState(false);

    // Form
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");

    useEffect(() => {
        if (isOpen) {
            setView('LIST');
            fetchCustomers();
        }
    }, [isOpen]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/customers`);
            if (res.ok) {
                const data = await res.json();
                setCustomers(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!name || !phone) return;
        try {
            const res = await fetch(`${API_URL}/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone })
            });
            if (res.ok) {
                const newCustomer = await res.json();
                onSelect(newCustomer);
                onClose();
            } else {
                alert("Failed to create customer");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 rounded-lg w-[400px] shadow-xl flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#252526] rounded-t-lg">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">Select Customer</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
                </div>

                {view === 'LIST' ? (
                    <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-[#333] border-none rounded text-sm focus:ring-1 focus:ring-[#d32f2f]"
                                placeholder="Search by name or phone..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2">
                            {loading ? (
                                <p className="text-sm text-gray-500 text-center py-4">Loading...</p>
                            ) : filtered.length > 0 ? (
                                filtered.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => { onSelect(c); onClose(); }}
                                        className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-[#252526] hover:bg-red-50 dark:hover:bg-red-900/10 rounded border border-transparent hover:border-red-200 transition-colors group text-left"
                                    >
                                        <div>
                                            <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{c.name}</p>
                                            <p className="text-xs text-gray-500">{c.phone}</p>
                                        </div>
                                        <Check className="w-4 h-4 text-[#d32f2f] opacity-0 group-hover:opacity-100" />
                                    </button>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">No customers found.</p>
                            )}
                        </div>

                        <button
                            onClick={() => setView('CREATE')}
                            className="w-full py-2 bg-[#d32f2f] hover:bg-[#b71c1c] text-white rounded font-bold text-sm flex items-center justify-center gap-2"
                        >
                            <UserPlus className="w-4 h-4" /> Add New Customer
                        </button>
                    </div>
                ) : (
                    <div className="p-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Customer Name</label>
                            <input
                                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-transparent text-sm"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Enter Full Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
                            <input
                                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-transparent text-sm"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="Enter Phone Number"
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setView('LIST')}
                                className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded font-bold text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                className="flex-1 py-2 bg-[#d32f2f] hover:bg-[#b71c1c] text-white rounded font-bold text-sm"
                            >
                                Save Customer
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
