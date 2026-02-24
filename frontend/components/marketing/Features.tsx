"use client";

import { motion } from 'framer-motion';
import { WifiOff, Layers, Zap, BarChart3, Users, Box } from 'lucide-react';

const features = [
    {
        icon: Zap,
        title: "Lightning Fast Billing",
        description: "Instant checkout. No delays. Built for high-volume environments."
    },
    {
        icon: WifiOff,
        title: "Works Even Without Internet",
        description: "Continue billing even when internet goes down. Sync automatically later."
    },
    {
        icon: Layers,
        title: "Multi-Branch Management",
        description: "Control all branches from one dashboard."
    },
    {
        icon: BarChart3,
        title: "Real-Time Reports",
        description: "Track sales, staff performance, and revenue instantly."
    },
    {
        icon: Users,
        title: "Staff & Role Management",
        description: "Control permissions and monitor activity."
    },
    {
        icon: Box,
        title: "Cloud Sync",
        description: "Access your business data from anywhere."
    }
];

const industries = [
    "Restaurants", "Cafés", "Retail Stores", "Supermarkets", "Cloud Kitchens", "Franchise Chains"
];

export function Features() {
    return (
        <section className="py-24 bg-surface/10 relative">
            <div className="max-w-7xl mx-auto px-6">

                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold font-serif italic mb-6">Everything you need to <span className="text-primary">scale</span></h2>
                    <p className="text-muted max-w-2xl mx-auto text-lg">
                        Built for speed, reliability, and growth. Neqtra provides the tools enterprise brands use, accessible to everyone.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="p-8 rounded-3xl bg-surface/40 border border-surface-light hover:border-primary/30 hover:bg-surface/60 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                            <p className="text-muted leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-32 text-center max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold font-serif italic mb-8">Perfect for</h2>
                    <div className="flex flex-wrap justify-center gap-4">
                        {industries.map((industry) => (
                            <span key={industry} className="px-6 py-3 rounded-full bg-background border border-surface-light text-foreground font-medium shadow-sm">
                                {industry}
                            </span>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
}
