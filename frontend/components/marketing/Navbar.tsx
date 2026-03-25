"use client";

import Link from "next/link";
import { ChevronDown, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const links = [
    { name: "Products", href: "#" },
    { name: "AI Agents", href: "#" },
    { name: "Solutions", href: "#" },
    { name: "Resources", href: "#" },
    { name: "Pricing", href: "/pricing" },
];

export function Navbar() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm font-sans">
            {/* Main Navbar */}
            <div className="max-w-[1400px] mx-auto px-6 h-[72px] flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xl">
                        N
                    </div>
                    <span className="font-sans font-bold text-2xl tracking-tight text-black">
                        Neqtra
                    </span>
                </Link>

                {/* Desktop Links */}
                <nav className="hidden lg:flex items-center gap-8">
                    {links.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-[17px] font-semibold text-gray-800 hover:text-black transition-colors flex items-center gap-1"
                        >
                            {link.name}
                            {link.name !== "Pricing" && <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </Link>
                    ))}
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-6">
                    <Link
                        href="/login"
                        className="text-[17px] font-bold text-[#6366F1] border-b-[3px] border-[#6366F1] pb-1 hover:text-indigo-400 hover:border-indigo-400 transition-colors"
                    >
                        Sign In
                    </Link>
                    <Link
                        href="/signup"
                        className="text-[17px] font-bold text-gray-800 border-b-[3px] border-transparent pb-1 hover:border-gray-800 transition-all"
                    >
                        Sign Up
                    </Link>

                    <Link
                        href="/login"
                        className="group flex items-center gap-3 bg-[#6366F1] hover:bg-indigo-600 text-white px-5 py-3 rounded-[34px] font-semibold text-[17px] transition-all shadow-[0_8px_30px_-4px_rgba(99,102,241,0.4)]"
                    >
                        Talk to Sales
                        <span className="bg-white rounded-full p-1 group-hover:bg-indigo-50 transition-colors flex items-center justify-center w-6 h-6">
                            <ArrowRight className="w-4 h-4 text-[#6366F1]" />
                        </span>
                    </Link>
                </div>
            </div>
        </header>
    );
}
