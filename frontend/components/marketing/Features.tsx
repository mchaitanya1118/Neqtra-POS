"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Building2, Store, Truck, Coffee } from "lucide-react";

const capabilities = [
    {
        title: "Omnichannel Intelligence",
        desc: "Connect your POS data, inventory, and supply chain natively. Get a unified view of your entire retail network in real-time.",
        bgColor: "bg-white",
        textColor: "text-black",
        descColor: "text-gray-600"
    },
    {
        title: "Store Automations",
        desc: "Reduce manual effort with automated reconciliation, smart alerts, and seamless integration with delivery platforms.",
        bgColor: "bg-gray-50",
        textColor: "text-black",
        descColor: "text-gray-600"
    },
    {
        title: "Compliance & Auditing",
        desc: "Stay ahead of regulatory changes with automated digital trails, instant tax calculations, and secure data storage.",
        bgColor: "bg-white",
        textColor: "text-black",
        descColor: "text-gray-600"
    }
];

export function Features() {
    return (
        <section className="bg-[#fcfcfc] py-20 font-sans border-t border-gray-100 relative z-20">
            <div className="max-w-[1400px] mx-auto px-6 mb-16">

                {/* Horizontal Carousel Area */}
                <div className="flex gap-8 overflow-x-auto pb-12 snap-x no-scrollbar">
                    {capabilities.map((cap, idx) => (
                        <div
                            key={idx}
                            className={`min-w-[85vw] md:min-w-[800px] flex-shrink-0 ${cap.bgColor} rounded-[32px] p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col md:flex-row items-center gap-12 snap-center`}
                        >
                            <div className="flex-1">
                                <h3 className={`text-[36px] font-bold ${cap.textColor} mb-6 leading-tight`}>
                                    {cap.title}
                                </h3>
                                <p className={`text-[18px] ${cap.descColor} leading-relaxed font-medium mb-8`}>
                                    {cap.desc}
                                </p>
                                <button className="text-[#6366F1] font-bold text-[17px] flex items-center gap-2 hover:gap-3 transition-all border-b-2 border-[#6366F1] pb-1 w-fit">
                                    Learn More <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Graphic Placeholder */}
                            <div className="flex-1 w-full bg-gray-100 rounded-2xl aspect-[4/3] border border-gray-200 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-50" />
                                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 z-10 font-medium text-gray-500 flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                                    Data Visualization Flow
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Carousel Controls */}
                <div className="flex items-center justify-center gap-6 mt-4">
                    <button className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-black hover:bg-gray-50 transition-colors shadow-sm">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-2.5 rounded-full bg-black" />
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                    </div>
                    <button className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-black hover:bg-gray-50 transition-colors shadow-sm">
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Trusted By Banner */}
            <div className="bg-[#0a1120] py-16 mt-24">
                <div className="max-w-[1400px] mx-auto px-6 text-center">
                    <h4 className="text-gray-400 font-medium text-sm tracking-widest uppercase mb-10">Trusted by fast-growing brands globally</h4>
                    <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="flex items-center gap-2 text-white font-bold text-2xl"><Coffee className="w-8 h-8" /> BrewCo</div>
                        <div className="flex items-center gap-2 text-white font-bold text-2xl"><Building2 className="w-8 h-8" /> UrbanRetail</div>
                        <div className="flex items-center gap-2 text-white font-bold text-2xl"><Store className="w-8 h-8" /> FreshMarket</div>
                        <div className="flex items-center gap-2 text-white font-bold text-2xl"><Truck className="w-8 h-8" /> SwiftLogistics</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
