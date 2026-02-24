"use client";

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function Hero() {
    return (
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse" />
            <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] -z-10" />

            <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-surface-light mb-8 hover:bg-surface-light transition-colors"
                >
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted">New: Multi-Branch Analytics</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-5xl md:text-7xl font-bold font-serif italic tracking-tight text-foreground mb-6 max-w-4xl leading-tight"
                >
                    Run Your Entire Business on One <span className="text-primary relative">Powerful
                        <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary opacity-30" viewBox="0 0 100 10" preserveAspectRatio="none">
                            <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                        </svg>
                    </span> POS
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-lg md:text-xl text-muted max-w-2xl mb-8 leading-relaxed"
                >
                    Neqtra POS is a lightning-fast, offline-ready, cloud-based POS system built for restaurants, cafés, and retail stores. Manage sales, inventory, staff, and reports from anywhere.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-4"
                >
                    <Link href="/signup">
                        <button className="px-8 py-4 bg-primary text-primary-fg text-lg font-bold rounded-full shadow-[0_10px_30px_rgba(105,215,189,0.4)] hover:shadow-[0_15px_40px_rgba(105,215,189,0.6)] hover:scale-105 transition-all active:scale-95 flex items-center gap-2">
                            Start Free 14-Day Trial <ArrowRight className="w-5 h-5" />
                        </button>
                    </Link>
                    <Link href="/demo">
                        <button className="px-8 py-4 bg-surface text-foreground border border-surface-light text-lg font-bold rounded-full hover:bg-surface-light transition-all active:scale-95">
                            Book Live Demo
                        </button>
                    </Link>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-sm text-muted font-medium mb-10"
                >
                    <CheckCircle2 className="w-4 h-4 inline mr-1 text-primary" /> No credit card required &nbsp;•&nbsp; <CheckCircle2 className="w-4 h-4 inline mr-1 text-primary" /> Setup in under 5 minutes
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.5 }}
                    className="mt-20 w-full max-w-5xl"
                >
                    {/* Mockup UI */}
                    <div className="relative rounded-2xl border border-surface-light bg-surface/50 backdrop-blur-xl shadow-2xl overflow-hidden aspect-[16/9] group">
                        <div className="absolute inset-x-0 top-0 h-8 bg-surface-light/50 flex items-center px-4 gap-2 border-b border-surface-light z-10">
                            <div className="w-3 h-3 rounded-full bg-red-500/50" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                            <div className="w-3 h-3 rounded-full bg-green-500/50" />
                        </div>
                        <div className="absolute inset-0 top-8 flex items-center justify-center text-muted font-mono text-sm bg-surface">
                            <Image
                                src="/dashboard-preview.png"
                                alt="POS Dashboard"
                                fill
                                priority
                                className="object-cover opacity-90 group-hover:scale-[1.02] transition-transform duration-700"
                            />
                        </div>
                    </div>
                </motion.div>

                <div className="mt-16 flex flex-col items-center">
                    <p className="text-sm font-bold uppercase tracking-wider text-muted mb-8 text-center">Trusted by growing businesses</p>
                    <div className="flex flex-wrap justify-center gap-6 md:gap-12">
                        <div className="flex flex-col items-center">
                            <span className="text-3xl font-bold text-foreground">1,000+</span>
                            <span className="text-sm text-muted">Active Terminals</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-3xl font-bold text-foreground">500+</span>
                            <span className="text-sm text-muted">Businesses</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-3xl font-bold text-foreground">99.99%</span>
                            <span className="text-sm text-muted">Uptime</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-3xl font-bold text-foreground">Millions</span>
                            <span className="text-sm text-muted">Monthly Transactions</span>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
