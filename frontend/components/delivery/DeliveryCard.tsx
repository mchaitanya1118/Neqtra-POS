"use client";

import { Delivery, useDeliveryStore } from "@/store/useDeliveryStore";
import {
    Package,
    User,
    MapPin,
    Truck,
    Phone,
    Clock,
    Trash2,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    IndianRupee,
    Edit2,
    Navigation
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DeliveryCardProps {
    delivery: Delivery;
    onAssign: (delivery: Delivery) => void;
    onStatusUpdate: (id: number, status: string) => void;
    onDelete: (id: number) => void;
}

export function DeliveryCard({ delivery, onAssign, onStatusUpdate, onDelete }: DeliveryCardProps) {
    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'PENDING': return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-yellow-500/5";
            case 'ASSIGNED': return "bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-blue-500/5";
            case 'PICKED_UP': return "bg-purple-500/10 text-purple-500 border-purple-500/20 shadow-purple-500/5";
            case 'DELIVERED': return "bg-green-500/10 text-green-500 border-green-500/20 shadow-green-500/5";
            case 'CANCELLED': return "bg-red-500/10 text-red-500 border-red-500/20 shadow-red-500/5";
            default: return "bg-surface-light text-muted border-surface-light";
        }
    };

    const isCompleteOrCancelled = ['DELIVERED', 'CANCELLED'].includes(delivery.status);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group bg-surface border border-surface-light p-6 rounded-[32px] hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all relative overflow-hidden flex flex-col h-full"
        >
            {/* Status Badge & Actions */}
            <div className="flex justify-between items-start mb-6">
                <div className={cn(
                    "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5",
                    getStatusStyles(delivery.status)
                )}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    {delivery.status.replace('_', ' ')}
                </div>

                <div className="flex gap-2 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                    {!isCompleteOrCancelled && (
                        <button
                            onClick={() => onAssign(delivery)}
                            className="p-2.5 bg-surface-light text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                            title="Edit Driver"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (confirm(`Delete delivery record for Order #${delivery.orderId}?`)) {
                                onDelete(delivery.id);
                            }
                        }}
                        className="p-2.5 bg-surface-light text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        title="Delete Delivery"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Header Content */}
            <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                    <Package className="w-7 h-7" />
                </div>
                <div>
                    <h3 className="text-xl font-black dark:text-white">Order #{delivery.orderId}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-wider mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(delivery.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>

            {/* Customer & Address Section */}
            <div className="space-y-4 mb-8 flex-1">
                <div className="p-4 bg-surface-light/30 rounded-2xl border border-surface-light/50 group-hover:border-primary/20 transition-all">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-surface-light flex items-center justify-center text-muted shrink-0">
                            <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-0.5">Customer</p>
                            <p className="font-bold text-sm truncate">{delivery.order?.customer?.name || 'Guest Customer'}</p>
                            {delivery.order?.customer?.phone && (
                                <p className="text-xs text-muted/60 flex items-center gap-1 mt-0.5">
                                    <Phone className="w-3 h-3" />
                                    {delivery.order.customer.phone}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-surface-light/50 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-surface-light flex items-center justify-center text-muted shrink-0">
                            <MapPin className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-0.5">Destination</p>
                            <p className="text-xs text-muted leading-relaxed line-clamp-2">{delivery.address}</p>
                        </div>
                    </div>
                </div>

                {/* Driver Section */}
                <div className={cn(
                    "p-4 rounded-2xl border transition-all flex items-center justify-between",
                    delivery.driverName
                        ? "bg-blue-500/5 border-blue-500/10"
                        : "bg-surface-light/20 border-surface-light/50"
                )}>
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center shadow-inner",
                            delivery.driverName ? "bg-blue-500/20 text-blue-500" : "bg-surface-light text-muted"
                        )}>
                            <Truck className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-muted/60 uppercase tracking-widest mb-0.5">Driver</p>
                            <p className={cn(
                                "text-xs font-bold",
                                delivery.driverName ? "text-foreground" : "text-muted italic"
                            )}>
                                {delivery.driverName || "Assign needed"}
                            </p>
                        </div>
                    </div>
                    {!isCompleteOrCancelled && (
                        <button
                            onClick={() => onAssign(delivery)}
                            className="text-[10px] font-black uppercase text-primary hover:underline hover:scale-105 transition-all"
                        >
                            {delivery.driverName ? "Change" : "Assign"}
                        </button>
                    )}
                </div>
            </div>

            {/* Footer Section */}
            <div className="mt-auto pt-6 border-t border-surface-light flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-1">Total Bill</p>
                    <div className="flex items-center gap-1.5 text-xl font-black text-foreground">
                        <IndianRupee className="w-4 h-4" />
                        {Number(delivery.order?.totalAmount).toLocaleString('en-IN')}
                    </div>
                </div>

                <div className="flex gap-2">
                    {delivery.status === 'PENDING' && (
                        <button
                            onClick={() => onAssign(delivery)}
                            className="px-5 py-2.5 bg-primary text-black font-black text-[10px] uppercase tracking-wider rounded-xl shadow-lg shadow-primary/25 hover:scale-105 hover:shadow-primary/40 active:scale-95 transition-all"
                        >
                            Assign Driver
                        </button>
                    )}
                    {delivery.status === 'ASSIGNED' && (
                        <button
                            onClick={() => onStatusUpdate(delivery.id, 'PICKED_UP')}
                            className="px-5 py-2.5 bg-blue-500 text-white font-black text-[10px] uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all"
                        >
                            Mark Picked Up
                        </button>
                    )}
                    {delivery.status === 'PICKED_UP' && (
                        <button
                            onClick={() => onStatusUpdate(delivery.id, 'DELIVERED')}
                            className="px-5 py-2.5 bg-green-500 text-white font-black text-[10px] uppercase tracking-wider rounded-xl shadow-lg shadow-green-500/25 hover:scale-105 active:scale-95 transition-all"
                        >
                            Confirm Delivery
                        </button>
                    )}
                </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-8 text-primary/5 -mr-4 -mt-4 rotate-12 group-hover:rotate-45 group-hover:scale-150 transition-all duration-700 pointer-events-none">
                <Navigation className="w-32 h-32" />
            </div>
        </motion.div>
    );
}
