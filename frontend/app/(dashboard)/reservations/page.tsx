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

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 relative">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Reservations</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary text-primary-fg px-4 py-2 rounded-xl text-sm font-bold hover:brightness-90 transition-all flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> New Reservation
                </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {loading ? (
                    <p className="text-muted">Loading...</p>
                ) : data.length === 0 ? (
                    <p className="text-muted col-span-full text-center py-20">No reservations found.</p>
                ) : (
                    data.map((res) => (
                        <div key={res.id} className="bg-surface border border-border p-5 rounded-2xl flex items-start gap-4 hover:border-primary/50 transition-colors">
                            <div className="w-12 h-12 rounded-full bg-surface-light flex items-center justify-center text-muted shrink-0">
                                <Users className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-lg truncate">{res.customerName}</h3>
                                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold border border-transparent", res.status === 'PENDING' ? "bg-yellow-500/20 text-yellow-500" : "bg-green-500/20 text-green-500")}>
                                        {res.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(res.date).toLocaleString()}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Phone className="w-3.5 h-3.5" />
                                        {res.contact || 'N/A'}
                                    </span>
                                </div>
                                {res.notes && <p className="mt-2 text-sm text-muted/80 italic">"{res.notes}"</p>}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold mb-4">New Reservation</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-muted uppercase mb-1 block">Customer Name</label>
                                <input
                                    required
                                    className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                    value={formData.customerName}
                                    onChange={e => setFormData(p => ({ ...p, customerName: e.target.value }))}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase mb-1 block">Date</label>
                                    <input
                                        type="date" required
                                        className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        value={formData.date}
                                        onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase mb-1 block">Time</label>
                                    <input
                                        type="time" required
                                        className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        value={formData.time}
                                        onChange={e => setFormData(p => ({ ...p, time: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase mb-1 block">Guests</label>
                                    <input
                                        type="number" min="1" required
                                        className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        value={formData.guests}
                                        onChange={e => setFormData(p => ({ ...p, guests: parseInt(e.target.value) }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase mb-1 block">Contact</label>
                                    <input
                                        type="tel"
                                        className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        value={formData.contact}
                                        onChange={e => setFormData(p => ({ ...p, contact: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted uppercase mb-1 block">Notes</label>
                                <textarea
                                    className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary h-20 resize-none"
                                    value={formData.notes}
                                    onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-surface-light hover:bg-surface-light/80 text-foreground py-2.5 rounded-xl text-sm font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-primary hover:brightness-90 text-primary-fg py-2.5 rounded-xl text-sm font-bold transition-colors"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
