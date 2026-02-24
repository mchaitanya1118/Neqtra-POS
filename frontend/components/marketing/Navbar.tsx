"use client";

import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { motion } from 'framer-motion';

export function Navbar() {
    const { user } = useAuthStore();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-surface-light">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-fg font-bold text-xl shadow-lg group-hover:shadow-[0_0_15px_rgba(105,215,189,0.5)] transition-all">
                        N
                    </div>
                    <span className="font-serif italic font-bold text-xl tracking-tight text-foreground">
                        Neqtra
                    </span>
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8">
                    {['Features', 'Solutions', 'Pricing', 'Resources'].map((item) => (
                        <Link
                            key={item}
                            href={`/${item.toLowerCase()}`}
                            className="text-sm font-medium text-muted hover:text-foreground transition-colors"
                        >
                            {item}
                        </Link>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/login"
                        className="text-sm font-bold text-muted hover:text-foreground transition-colors hidden sm:block"
                    >
                        Log in
                    </Link>
                    <Link href="/signup">
                        <button className="px-5 py-2 bg-primary text-primary-fg text-sm font-bold rounded-full shadow-[0_4px_14px_rgba(105,215,189,0.4)] hover:shadow-[0_6px_20px_rgba(105,215,189,0.6)] hover:scale-105 transition-all active:scale-95">
                            Start Free Trial
                        </button>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
