"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const plans = [
    {
        name: "Starter",
        price: { monthly: 999, yearly: 799 },
        description: "Perfect for single locations.",
        features: [
            "1 Branch",
            "2 POS Devices",
            "Basic Reports",
            "Email Support"
        ],
        cta: "Start Free Trial",
        popular: false
    },
    {
        name: "Pro",
        price: { monthly: 2999, yearly: 2499 },
        description: "For growing businesses.",
        features: [
            "5 Branches",
            "Unlimited Devices",
            "Advanced Reports",
            "Inventory Management",
            "Priority Support"
        ],
        cta: "Start Free Trial",
        popular: true
    },
    {
        name: "Enterprise",
        price: { monthly: 'Custom', yearly: 'Custom' },
        description: "Full control for large chains.",
        features: [
            "Unlimited Branches",
            "Unlimited Devices",
            "Custom Features",
            "Dedicated Support"
        ],
        cta: "Contact Sales",
        popular: false
    }
];

export function Pricing() {
    const [isYearly, setIsYearly] = useState(true);

    return (
        <section className="py-24 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">

                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-bold font-serif italic mb-6">Simple, transparent <span className="text-primary">pricing</span></h2>
                    <p className="text-muted max-w-2xl mx-auto text-lg mb-8">
                        Choose the plan that fits your business stage. No hidden fees.
                    </p>

                    {/* Toggle */}
                    <div className="inline-flex bg-surface border border-surface-light rounded-full p-1 relative">
                        <div className={cn(
                            "absolute top-1 bottom-1 w-[50%] bg-primary rounded-full transition-all duration-300",
                            isYearly ? "left-[50%]" : "left-1"
                        )} />
                        <button
                            onClick={() => setIsYearly(false)}
                            className={cn("relative z-10 px-6 py-2 text-sm font-bold rounded-full transition-colors", !isYearly ? "text-primary-fg" : "text-muted hover:text-foreground")}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setIsYearly(true)}
                            className={cn("relative z-10 px-6 py-2 text-sm font-bold rounded-full transition-colors", isYearly ? "text-primary-fg" : "text-muted hover:text-foreground")}
                        >
                            Yearly <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full ml-1">-20%</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={cn(
                                "relative p-8 rounded-3xl border flex flex-col",
                                plan.popular
                                    ? "bg-surface/50 border-primary shadow-[0_0_30px_rgba(105,215,189,0.15)] scale-105 z-10"
                                    : "bg-surface/20 border-surface-light"
                            )}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-fg text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                                <p className="text-muted text-sm">{plan.description}</p>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold">{typeof plan.price.monthly === 'number' ? '₹' : ''}{isYearly ? plan.price.yearly : plan.price.monthly}</span>
                                    {typeof plan.price.monthly === 'number' && <span className="text-muted">/mo</span>}
                                </div>
                                {isYearly && (
                                    <p className="text-xs text-green-500 mt-1 font-bold">Billed annually</p>
                                )}
                            </div>

                            <div className="flex-1 space-y-4 mb-8">
                                {plan.features.map((feature) => (
                                    <div key={feature} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                            <Check className="w-3 h-3 text-primary" />
                                        </div>
                                        <span className="text-sm text-foreground/80">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <Link href="/signup">
                                <button className={cn(
                                    "w-full py-3 rounded-full font-bold text-sm transition-all active:scale-95",
                                    plan.popular
                                        ? "bg-primary text-primary-fg shadow-lg hover:shadow-primary/30"
                                        : "bg-surface text-foreground border border-surface-light hover:bg-surface-light"
                                )}>
                                    {plan.cta}
                                </button>
                            </Link>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
}
