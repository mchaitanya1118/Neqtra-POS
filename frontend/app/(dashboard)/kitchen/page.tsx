"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/config";

interface OrderItem {
    id: number;
    quantity: number;
    status: string; // Add status
    menuItem: {
        title: string;
    };
}

interface Order {
    id: number;
    tableName: string;
    items: OrderItem[];
    status: string;
    createdAt: string;
}

export default function KitchenPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Fetch existing active orders
        const fetchOrders = async () => {
            try {
                // Ideally this should be a filtered endpoint like /orders/active-list
                // For now we fetch all and filter client side or backend should support filter
                const res = await fetch(`${API_URL}/orders`);
                if (res.ok) {
                    const data: Order[] = await res.json();
                    // Filter only active orders (PENDING, CONFIRMED, PARTIAL), ignore COMPLETED or CANCELLED
                    // Also filter out orders with no items if any
                    const active = data.filter(o => ['PENDING', 'CONFIRMED', 'PARTIAL'].includes(o.status) && o.items?.length > 0);
                    setOrders(active);
                }
            } catch (e) { console.error("Failed to fetch kitchen orders", e); }
        };
        fetchOrders();

        // Connect to backend websocket
        const socket = io(API_URL);

        socket.on("connect", () => {
            console.log("Connected to Kitchen Gateway");
            setIsConnected(true);
        });

        socket.on("disconnect", () => {
            console.log("Disconnected from Kitchen Gateway");
            setIsConnected(false);
        });

        // Listen for new orders
        socket.on("new_order", (newOrder: Order) => {
            setOrders((prev) => {
                const exists = prev.find(o => o.id === newOrder.id);
                // Play sound
                const audio = new Audio('/notification.mp3');
                audio.play().catch(e => console.log("Audio play failed", e));

                if (exists) {
                    // Update existing order
                    return prev.map(o => o.id === newOrder.id ? newOrder : o);
                } else {
                    // Add new order
                    return [...prev, newOrder];
                }
            });
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Filter logic: Only show orders that have PENDING items
    const pendingOrders = orders
        .map(order => ({
            ...order,
            items: order.items?.filter(item => item.status === 'PENDING' || !item.status) // Default to show if status missing
        }))
        .filter(order => order.items && order.items.length > 0);

    const handleMarkComplete = async (orderId: number) => {
        try {
            const res = await fetch(`${API_URL}/orders/${orderId}/serve`, { method: 'POST' });
            if (res.ok) {
                // Optimistic update: Remove locally or wait for socket
                // Since we broadcast on backend, socket will update.
                // But for responsiveness:
                setOrders(prev => prev.map(o => {
                    if (o.id === orderId) {
                        return {
                            ...o,
                            items: o.items.map(i => ({ ...i, status: 'SERVED' }))
                        };
                    }
                    return o;
                }));
            }
        } catch (e) { console.error("Failed to mark complete", e); }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            {/* ... header ... */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {pendingOrders.map((order) => (
                    <div key={order.id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-lg animate-in fade-in zoom-in-95 duration-300">
                        {/* Card Header - Add 'ADD ON' badge if needed */}
                        <div className="bg-gray-700/50 p-4 flex justify-between items-center border-b border-gray-700">
                            <div>
                                <h3 className="font-bold text-xl text-yellow-500">#{order.id}</h3>
                                <p className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleTimeString()}</p>
                            </div>
                            <div className="text-right">
                                <div className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-lg font-bold text-lg mb-1">
                                    {order.tableName}
                                </div>
                                {/* <span className="text-xs text-muted-foreground">Is Add-on? Check logic</span> */}
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="p-4 space-y-3">
                            {order.items?.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-lg">
                                    <span className="font-medium text-gray-200">{item.menuItem?.title || "Unknown Item"}</span>
                                    <span className="font-bold text-yellow-500">x{item.quantity}</span>
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="p-4 bg-gray-700/30 border-t border-gray-700 mt-auto">
                            <button
                                onClick={() => handleMarkComplete(order.id)}
                                className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Mark Complete
                            </button>
                        </div>
                    </div>
                ))}

                {pendingOrders.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-600">
                        <CheckCircle className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-xl">All caught up!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
