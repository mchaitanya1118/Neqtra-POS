"use client";

import { Search } from "lucide-react";

export function Topbar() {
    return (
        <header className="h-16 flex items-center px-6 gap-4">
            {/* Search Bar - styled to match reference */}
            <div className="relative w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 bg-surface border border-transparent rounded-xl text-sm placeholder-muted focus:outline-none focus:ring-1 focus:ring-border focus:bg-surface-light transition-colors text-foreground"
                    placeholder="Search menu items, orders..."
                />
            </div>

            <div className="ml-auto flex items-center gap-4">
                {/* Additional header items could go here */}
                <div className="text-sm text-muted">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </div>
            </div>
        </header>
    );
}
