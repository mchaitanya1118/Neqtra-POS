"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const plans = [
    {
        name: "Essentials",
        price: "49",
        description: "Perfect for single-location shops and rapid checkout.",
        features: [
            "Unlimited transactions",
            "Core inventory tracking",
            "Offline-first sync",
            "Standard email support",
            "Basic reporting"
        ]
    },
    {
        name: "Professional",
        price: "99",
        popular: true,
        description: "Ideal for growing multi-location retail chains.",
        features: [
            "Everything in Essentials",
            "Multi-branch management",
            "Advanced granular RBAC",
            "Priority 24/7 support",
            "Custom analytics dashboards",
            "API Access"
        ]
    },
    {
        name: "Enterprise",
        price: "Custom",
        description: "For large scale businesses needing custom isolation.",
        features: [
            "Everything in Professional",
            "Dedicated isolated tenant database",
            "Custom integrations",
            "Dedicated account manager",
            "On-premise deployment options",
            "SLA guarantees"
        ]
    }
];

export function Pricing() {
    const [annual, setAnnual] = useState(true);

    return (
        <section className="py-24 bg-white border-t border-gray-100 font-sans">
            <div className="max-w-[1400px] mx-auto px-6">

                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-[40px] font-bold text-black mb-6">Simple, Transparent Pricing</h2>
                    <p className="text-gray-600 text-[18px] font-medium leading-relaxed">
                        Choose the right plan for your retail operations. No hidden fees.
                    </p>
                </div>

                <div className="flex justify-center mb-16">
                    <div className="bg-gray-100 p-1.5 rounded-full flex items-center gap-1 border border-gray-200 shadow-inner">
                        <button
                            onClick={() => setAnnual(false)}
                            className={cn(
                                "px-6 py-2.5 rounded-full text-[15px] font-bold transition-all",
                                !annual ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"
                            )}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setAnnual(true)}
                            className={cn(
                                "px-6 py-2.5 rounded-full text-[15px] font-bold transition-all flex items-center gap-2",
                                annual ? "bg-[#6366F1] text-white shadow-md shadow-indigo-500/20" : "text-gray-500 hover:text-black"
                            )}
                        >
                            Annually
                            <span className={cn(
                                "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded flex items-center justify-center",
                                annual ? "bg-white/20 text-white" : "bg-green-100 text-green-700"
                            )}>Save 20%</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={cn(
                                "relative p-10 rounded-[32px] border flex flex-col bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-[#6366F1]/50 transition-colors",
                                plan.popular ? "border-[#6366F1] shadow-[0_20px_60px_-15px_rgba(99,102,241,0.2)] md:-translate-y-4" : "border-gray-200"
                            )}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0f62fe] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-black mb-2">{plan.name}</h3>
                                <p className="text-sm font-medium text-gray-500 h-10">{plan.description}</p>
                            </div>

                            <div className="mb-8 flex items-baseline gap-2">
                                <span className="text-5xl font-extrabold text-black">
                                    {plan.price !== "Custom" && "$"}
                                    {plan.price === "Custom" ? "Custom" : annual ? Math.floor(Number(plan.price) * 0.8) : plan.price}
                                </span>
                                {plan.price !== "Custom" && <span className="text-gray-500 font-medium">/mo</span>}
                            </div>

                            <button className={cn(
                                "w-full py-4 rounded-full font-bold text-[16px] transition-all flex items-center justify-center gap-2 group mb-10",
                                plan.popular
                                    ? "bg-[#6366F1] hover:bg-indigo-600 text-white shadow-[0_8px_30px_-4px_rgba(99,102,241,0.4)]"
                                    : "bg-gray-100 hover:bg-gray-200 text-black"
                            )}>
                                Get Started
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <div className="flex-1 space-y-4">
                                <p className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">What's included</p>
                                {plan.features.map((feature, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
                                        <span className="text-gray-600 font-medium">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
