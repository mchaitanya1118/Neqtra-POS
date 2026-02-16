"use client";

import { useEffect, useState } from "react";
import { Plus, Users, Calendar, Phone, CheckCircle, XCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/config";

interface Reservation {
    id: number;
    customerName: string;
    contact: string;
    date: string;
    guests: number;
    status: string;
    notes: string;
}

export default function ReservationsPage() {
    const [data, setData] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [cancelId, setCancelId] = useState<number | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        customerName: "",
        contact: "",
        date: "",
        time: "",
        guests: 2,
        notes: ""
    });

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/reservations`);
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    const handleCancel = async () => {
        if (!cancelId) return;
        try {
            const res = await fetch(`${API_URL}/reservations/${cancelId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setData(prev => prev.filter(item => item.id !== cancelId));
                setCancelId(null);
            }
        } catch (e) {
            console.error("Failed to cancel reservation", e);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Combine date and time
            const isoDate = new Date(`${formData.date}T${formData.time}`).toISOString();

            const res = await fetch(`${API_URL}/reservations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, date: isoDate })
            });

            if (res.ok) {
                fetchReservations();
                setIsModalOpen(false);
                setFormData({ customerName: "", contact: "", date: "", time: "", guests: 2, notes: "" });
            }
        } catch (e) {
            console.error("Failed to create reservation", e);
        }
    };

    // ... (imports and state logic remain similar, but styling changes drastically)

    return (
        <div className="min-h-screen bg-background text-foreground font-sans overflow-hidden relative selection:bg-primary/30 flex flex-col">
            {/* Background Ambience */}
            <div className="fixed inset-0 bg-[url('/login-bg.png')] bg-cover bg-center opacity-10 pointer-events-none" />
            <div className="fixed inset-0 bg-gradient-to-br from-background via-background/95 to-background/80 pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-surface-light px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 transition-all duration-300">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold font-serif italic tracking-tighter text-foreground">Reservations</h1>
                    <span className="px-3 py-1 bg-surface-light rounded-full text-xs font-bold text-muted border border-surface-light/50">
                        {data.length} Active
                    </span>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-fg rounded-full text-sm font-bold shadow-[0_0_20px_rgba(105,215,189,0.3)] hover:shadow-[0_0_30px_rgba(105,215,189,0.5)] transition-all transform hover:scale-105 active:scale-95 group"
                    >
                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                        <span>New Reservation</span>
                    </button>
                    <div className="relative group w-full sm:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                        <input
                            className="w-full pl-11 pr-4 py-2.5 bg-surface-light/50 border border-surface-light/50 focus:border-primary/50 rounded-full text-sm text-foreground placeholder:text-muted focus:outline-none transition-all ring-1 ring-transparent focus:ring-primary/20 backdrop-blur-sm"
                            placeholder="Search guest name..."
                        />
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto px-6 py-8 relative z-10 custom-scrollbar">
                <div className="max-w-7xl mx-auto">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-40 bg-surface/20 rounded-[24px] border border-surface-light/30" />
                            ))}
                        </div>
                    ) : data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-surface/30 rounded-full flex items-center justify-center mb-6">
                                <Calendar className="w-10 h-10 text-muted/50" />
                            </div>
                            <h3 className="text-2xl font-bold font-serif italic text-foreground mb-2">No Reservations Yet</h3>
                            <p className="text-muted max-w-sm mx-auto">
                                Use the "New Reservation" button to add guests to the waitlist or schedule future dining.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                            {data.map((res) => (
                                <div
                                    key={res.id}
                                    className="group relative bg-surface/30 hover:bg-surface/50 backdrop-blur-md border border-surface-light hover:border-primary/30 rounded-[24px] p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1"
                                >
                                    {/* Status Badge */}
                                    <div className="absolute top-4 right-4">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md",
                                            res.status === 'PENDING'
                                                ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.2)]"
                                                : "bg-primary/10 text-primary border-primary/20 shadow-[0_0_10px_rgba(105,215,189,0.2)]"
                                        )}>
                                            {res.status}
                                        </span>
                                    </div>

                                    {/* Header: Avatar & Name */}
                                    <div className="flex items-center gap-4 mb-6 pr-20">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-surface-light to-surface border border-surface-light/50 flex items-center justify-center text-foreground shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                            <Users className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-foreground font-serif italic tracking-tight line-clamp-1 group-hover:text-primary transition-colors">{res.customerName}</h3>
                                            <p className="text-xs text-muted font-medium uppercase tracking-wider">{res.guests} Guests</p>
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm border-t border-surface-light/50 pt-4 mb-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Date</span>
                                            <div className="flex items-center gap-1.5 text-foreground font-medium">
                                                <Calendar className="w-3.5 h-3.5 text-primary" />
                                                {new Date(res.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Time</span>
                                            <div className="flex items-center gap-1.5 text-foreground font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                {new Date(res.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <div className="col-span-2 flex flex-col gap-1">
                                            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Contact</span>
                                            <div className="flex items-center gap-1.5 text-foreground font-medium group/phone cursor-pointer hover:text-primary transition-colors">
                                                <Phone className="w-3.5 h-3.5 text-muted group-hover/phone:text-primary transition-colors" />
                                                {res.contact || 'No Contact Info'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    {res.notes && (
                                        <div className="bg-background/40 rounded-xl p-3 border border-surface-light/30 mb-4">
                                            <p className="text-xs text-muted/80 italic leading-relaxed line-clamp-2">
                                                "{res.notes}"
                                            </p>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <button
                                        onClick={() => setCancelId(res.id)}
                                        className="w-full py-2 rounded-xl bg-surface-light/50 hover:bg-red-500/10 text-muted hover:text-red-500 border border-transparent hover:border-red-500/30 text-xs font-bold uppercase tracking-wider transition-all"
                                    >
                                        Cancel Reservation
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => setIsModalOpen(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative w-full max-w-lg bg-surface/90 backdrop-blur-xl border border-surface-light rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-surface-light flex items-center justify-between bg-surface/50">
                            <div>
                                <h2 className="text-2xl font-bold font-serif italic text-foreground tracking-tight">New Reservation</h2>
                                <p className="text-sm text-muted">Enter guest details to confirm booking</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-surface-light/50 hover:bg-surface-light flex items-center justify-center text-muted hover:text-foreground transition-all"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Guest Name</label>
                                    <div className="relative group">
                                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                        <input
                                            required
                                            className="w-full pl-10 pr-4 py-3.5 bg-background/50 border border-surface-light rounded-2xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm font-medium text-foreground placeholder:text-muted/50"
                                            placeholder="Enter guest name"
                                            value={formData.customerName}
                                            onChange={e => setFormData(p => ({ ...p, customerName: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Date</label>
                                        <div className="relative group">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors pointer-events-none" />
                                            <input
                                                type="date" required
                                                className="w-full pl-10 pr-4 py-3.5 bg-background/50 border border-surface-light rounded-2xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm font-medium text-foreground appearance-none"
                                                value={formData.date}
                                                onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Time</label>
                                        <input
                                            type="time" required
                                            className="w-full px-4 py-3.5 bg-background/50 border border-surface-light rounded-2xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm font-medium text-foreground appearance-none"
                                            value={formData.time}
                                            onChange={e => setFormData(p => ({ ...p, time: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Guests</label>
                                        <div className="relative group">
                                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="number" min="1" required
                                                className="w-full pl-10 pr-4 py-3.5 bg-background/50 border border-surface-light rounded-2xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm font-medium text-foreground"
                                                value={formData.guests}
                                                onChange={e => setFormData(p => ({ ...p, guests: parseInt(e.target.value) }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Contact</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="tel" required
                                                placeholder="Phone number"
                                                className="w-full pl-10 pr-4 py-3.5 bg-background/50 border border-surface-light rounded-2xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm font-medium text-foreground"
                                                value={formData.contact}
                                                onChange={e => setFormData(p => ({ ...p, contact: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Notes (Optional)</label>
                                    <textarea
                                        className="w-full px-4 py-3.5 bg-background/50 border border-surface-light rounded-2xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm font-medium text-foreground h-24 resize-none placeholder:text-muted/50"
                                        placeholder="Specific requests, allergies, etc."
                                        value={formData.notes}
                                        onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-surface-light/50">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3.5 rounded-full bg-surface hover:bg-surface-light border border-surface-light text-foreground text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3.5 rounded-full bg-primary hover:bg-primary/90 text-primary-fg text-sm font-bold shadow-[0_4px_20px_rgba(105,215,189,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Confirm Reservation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {cancelId && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => setCancelId(null)}
                    />
                    <div className="relative w-full max-w-sm bg-surface/90 backdrop-blur-xl border border-surface-light rounded-[32px] shadow-2xl p-6 text-center animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">Cancel Reservation?</h3>
                        <p className="text-sm text-muted mb-6">Are you sure you want to cancel this reservation? This action cannot be undone.</p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setCancelId(null)}
                                className="flex-1 py-3 rounded-full bg-surface hover:bg-surface-light border border-surface-light text-foreground text-sm font-bold transition-colors"
                            >
                                No, Keep It
                            </button>
                            <button
                                onClick={handleCancel}
                                className="flex-1 py-3 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors shadow-lg shadow-red-500/20"
                            >
                                Yes, Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
