"use client";

import { useEffect, useRef, useState } from "react";
import {
    Bell,
    CheckCheck,
    Trash2,
    Info,
    CheckCircle,
    AlertTriangle,
    XCircle,
    X,
    Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotificationStore, Notification } from "@/store/useNotificationStore";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const {
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        connectSocket,
        disconnectSocket
    } = useNotificationStore();

    useEffect(() => {
        fetchNotifications();
        connectSocket();
        return () => disconnectSocket();
    }, [fetchNotifications, connectSocket, disconnectSocket]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'SUCCESS': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'WARNING': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            case 'ERROR': return <XCircle className="w-5 h-5 text-red-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "relative p-2 rounded-xl transition-all duration-300",
                    isOpen ? "bg-primary/20 text-primary shadow-lg shadow-primary/20" : "text-muted hover:bg-surface-light hover:text-primary"
                )}
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-surface animate-in zoom-in">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-[380px] bg-surface/90 backdrop-blur-xl border border-surface-light rounded-[32px] shadow-2xl overflow-hidden z-50 origin-top-right"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-surface-light/50 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-lg text-foreground">Notifications</h3>
                                <p className="text-xs text-muted">You have {unreadCount} unread messages</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => markAllAsRead()}
                                    title="Mark all as read"
                                    className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                >
                                    <CheckCheck className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => clearAll()}
                                    title="Clear all"
                                    className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                            {notifications.length > 0 ? (
                                <div className="divide-y divide-surface-light/30">
                                    {notifications.map((notification) => (
                                        <motion.div
                                            layout
                                            key={notification.id}
                                            className={cn(
                                                "p-5 flex gap-4 hover:bg-white/5 transition-colors relative group",
                                                !notification.read && "bg-primary/5"
                                            )}
                                        >
                                            <div className="mt-1">{getTypeIcon(notification.type)}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className={cn(
                                                        "font-bold text-sm truncate pr-4",
                                                        notification.read ? "text-foreground-light" : "text-foreground"
                                                    )}>
                                                        {notification.title}
                                                    </h4>
                                                    <span className="text-[10px] text-muted flex items-center gap-1 whitespace-nowrap">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted leading-relaxed line-clamp-2">
                                                    {notification.message}
                                                </p>

                                                <div className="mt-3 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!notification.read && (
                                                        <button
                                                            onClick={() => markAsRead(notification.id)}
                                                            className="text-[11px] font-bold text-primary hover:underline"
                                                        >
                                                            Mark as read
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => deleteNotification(notification.id)}
                                                        className="text-[11px] font-bold text-red-500 hover:underline"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>

                                            {!notification.read && (
                                                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-surface-light rounded-full flex items-center justify-center mb-4">
                                        <Bell className="w-8 h-8 text-muted/30" />
                                    </div>
                                    <p className="text-sm font-medium text-muted">All caught up!</p>
                                    <p className="text-xs text-muted/60 mt-1">No new notifications</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-surface-light/50 bg-surface-light/30 text-center">
                            <button
                                className="text-xs font-bold text-primary hover:text-primary-dark transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                Close Panel
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
