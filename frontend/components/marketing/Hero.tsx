"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/* ─── POS Dashboard Mockups ────────────────────────── */

const SalesDashboardMockup = () => (
    <div className="w-full h-full bg-[#0f172a] flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="text-white font-bold text-xs tracking-wide">Neqtra POS — Sales</div>
            <div className="text-xs text-gray-400">Today, Mar 4</div>
        </div>
        {/* KPI row */}
        <div className="grid grid-cols-3 gap-2 p-3">
            {[
                { label: "Revenue", value: "₹1.24L", up: true },
                { label: "Orders", value: "284", up: true },
                { label: "Avg Order", value: "₹437", up: false },
            ].map((k) => (
                <div key={k.label} className="bg-white/5 rounded-xl p-2">
                    <div className="text-[10px] text-gray-400">{k.label}</div>
                    <div className="text-white font-bold text-sm mt-0.5">{k.value}</div>
                    <div className={`text-[9px] mt-0.5 font-semibold ${k.up ? "text-emerald-400" : "text-red-400"}`}>
                        {k.up ? "▲ 12%" : "▼ 3%"}
                    </div>
                </div>
            ))}
        </div>
        {/* Bar chart */}
        <div className="flex-1 px-3 pb-3 flex flex-col">
            <div className="text-[10px] text-gray-400 mb-2 font-semibold">Hourly Revenue</div>
            <div className="flex-1 flex items-end gap-1">
                {[30, 55, 40, 75, 60, 90, 80, 100, 70, 85, 65, 95].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                        <div
                            className="w-full rounded-t-sm"
                            style={{
                                height: `${h}%`,
                                background: i === 7 ? "linear-gradient(180deg,#818cf8,#6366f1)" : "rgba(99,102,241,0.35)"
                            }}
                        />
                    </div>
                ))}
            </div>
            <div className="flex justify-between mt-1">
                {["9am", "12pm", "3pm", "6pm", "9pm"].map(t => (
                    <span key={t} className="text-[9px] text-gray-500">{t}</span>
                ))}
            </div>
        </div>
    </div>
);

const BillingMockup = () => (
    <div className="w-full h-full bg-white flex overflow-hidden">
        {/* Left: item list */}
        <div className="flex-1 bg-gray-50 flex flex-col border-r border-gray-100">
            <div className="px-3 py-2 border-b border-gray-100 text-[10px] font-bold text-gray-700">ORDER #1042</div>
            <div className="flex-1 overflow-hidden divide-y divide-gray-100">
                {[
                    { name: "Masala Chai", qty: 2, price: "₹80" },
                    { name: "Veg Sandwich", qty: 1, price: "₹120" },
                    { name: "Cold Coffee", qty: 3, price: "₹360" },
                    { name: "Samosa (2pc)", qty: 2, price: "₹60" },
                ].map((item) => (
                    <div key={item.name} className="flex items-center justify-between px-3 py-2">
                        <div>
                            <div className="text-[10px] font-semibold text-gray-800">{item.name}</div>
                            <div className="text-[9px] text-gray-500">Qty: {item.qty}</div>
                        </div>
                        <div className="text-[10px] font-bold text-gray-800">{item.price}</div>
                    </div>
                ))}
            </div>
            <div className="px-3 py-2 border-t border-gray-200 bg-white">
                <div className="flex justify-between text-[10px] text-gray-500 mb-1"><span>Subtotal</span><span>₹620</span></div>
                <div className="flex justify-between text-[10px] text-gray-500 mb-1"><span>GST 5%</span><span>₹31</span></div>
                <div className="flex justify-between text-[11px] font-bold text-gray-900"><span>Total</span><span>₹651</span></div>
            </div>
        </div>
        {/* Right: payment */}
        <div className="w-[120px] flex flex-col gap-2 p-2 bg-white">
            <div className="text-[10px] font-bold text-gray-700 mb-1">Pay Via</div>
            {[
                { label: "UPI", active: true, color: "bg-indigo-600" },
                { label: "Card", active: false, color: "bg-gray-100" },
                { label: "Cash", active: false, color: "bg-gray-100" },
            ].map((m) => (
                <div key={m.label}
                    className={`flex items-center justify-center rounded-lg py-2 text-[10px] font-bold cursor-pointer ${m.active ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}>
                    {m.label}
                </div>
            ))}
            <div className="mt-auto bg-indigo-600 text-white rounded-lg py-2 text-[10px] font-bold text-center cursor-pointer">
                Collect ₹651
            </div>
        </div>
    </div>
);

const InventoryMockup = () => (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
            <div className="text-xs font-bold text-gray-800">Inventory</div>
            <div className="bg-indigo-50 text-indigo-600 text-[9px] font-bold px-2 py-0.5 rounded-full">12 Low Stock</div>
        </div>
        <div className="flex-1 overflow-hidden divide-y divide-gray-100">
            {[
                { name: "Arabica Coffee Beans", stock: 4, unit: "kg", status: "low" },
                { name: "Whole Milk", stock: 12, unit: "L", status: "ok" },
                { name: "Sandwich Bread", stock: 3, unit: "pcs", status: "critical" },
                { name: "Sugar", stock: 25, unit: "kg", status: "ok" },
                { name: "Samosa Dough", stock: 8, unit: "kg", status: "low" },
                { name: "Mineral Water", stock: 48, unit: "bottles", status: "ok" },
            ].map((item) => (
                <div key={item.name} className="flex items-center justify-between px-3 py-2">
                    <div>
                        <div className="text-[10px] font-semibold text-gray-800">{item.name}</div>
                        <div className="text-[9px] text-gray-500">{item.stock} {item.unit} remaining</div>
                    </div>
                    <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.status === "critical" ? "bg-red-100 text-red-600" :
                            item.status === "low" ? "bg-amber-100 text-amber-700" :
                                "bg-emerald-100 text-emerald-700"
                        }`}>
                        {item.status === "critical" ? "Critical" : item.status === "low" ? "Low" : "OK"}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const MultiLocationMockup = () => (
    <div className="w-full h-full bg-[#0f172a] flex flex-col overflow-hidden">
        <div className="px-3 py-2 border-b border-white/10 text-[10px] font-bold text-white">All Branches</div>
        <div className="flex-1 overflow-hidden divide-y divide-white/5 p-2 flex flex-col gap-2">
            {[
                { name: "Banjara Hills", revenue: "₹54,200", orders: 142, status: "open" },
                { name: "Jubilee Hills", revenue: "₹38,900", orders: 98, status: "open" },
                { name: "Gachibowli", revenue: "₹61,100", orders: 183, status: "open" },
                { name: "Madhapur", revenue: "₹22,400", orders: 67, status: "closed" },
            ].map((b) => (
                <div key={b.name} className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
                    <div>
                        <div className="text-white text-[10px] font-bold">{b.name}</div>
                        <div className="text-gray-400 text-[9px] mt-0.5">{b.orders} orders today</div>
                    </div>
                    <div className="text-right">
                        <div className="text-indigo-400 text-[11px] font-bold">{b.revenue}</div>
                        <div className={`text-[9px] mt-0.5 font-semibold ${b.status === "open" ? "text-emerald-400" : "text-gray-500"}`}>
                            {b.status === "open" ? "● Open" : "● Closed"}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const KitchenDisplayMockup = () => (
    <div className="w-full h-full bg-[#1e1b4b] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
            <div className="text-white font-bold text-[10px] tracking-wide">Kitchen Display</div>
            <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] text-gray-400">Live</span>
            </div>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-2 p-2 overflow-hidden">
            {[
                { id: "#1042", items: ["Cold Coffee ×2", "Veg Sandwich ×1"], time: "2m ago", status: "new" },
                { id: "#1043", items: ["Masala Chai ×3", "Samosa ×2"], time: "5m ago", status: "preparing" },
                { id: "#1040", items: ["Espresso ×1"], time: "8m ago", status: "ready" },
                { id: "#1039", items: ["Pasta ×2", "Cold Coffee ×1"], time: "12m ago", status: "done" },
            ].map((order) => (
                <div key={order.id}
                    className={`rounded-xl p-2 border ${order.status === "new" ? "bg-red-900/50 border-red-500/50" :
                            order.status === "preparing" ? "bg-amber-900/50 border-amber-500/50" :
                                order.status === "ready" ? "bg-emerald-900/50 border-emerald-500/50" :
                                    "bg-white/5 border-white/10"
                        }`}
                >
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-bold text-[10px]">{order.id}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${order.status === "new" ? "bg-red-500 text-white" :
                                order.status === "preparing" ? "bg-amber-500 text-white" :
                                    order.status === "ready" ? "bg-emerald-500 text-white" :
                                        "bg-white/10 text-gray-400"
                            }`}>
                            {order.status.toUpperCase()}
                        </span>
                    </div>
                    {order.items.map(item => (
                        <div key={item} className="text-[9px] text-gray-300">{item}</div>
                    ))}
                    <div className="text-[8px] text-gray-500 mt-1">{order.time}</div>
                </div>
            ))}
        </div>
    </div>
);

/* ─── Slide definitions ────────────────────────────── */

const slides = [
    {
        title: "Real-Time Sales Analytics & Reporting",
        desc: "Get a unified view of all your sales, orders, and revenue across every location — updated in real-time with actionable hourly breakdowns.",
        Mockup: SalesDashboardMockup,
    },
    {
        title: "Blazing-Fast Billing & Order Management",
        desc: "Process orders in seconds with a touch-optimized POS interface. Handle UPI, card, and cash payments — all from one streamlined checkout flow.",
        Mockup: BillingMockup,
    },
    {
        title: "Smart Inventory Tracking with Low-Stock Alerts",
        desc: "Monitor all your raw materials and products in real-time. Get instant alerts when stock hits critical levels across every branch.",
        Mockup: InventoryMockup,
    },
    {
        title: "Multi-Location Management from One Dashboard",
        desc: "Manage all your branches from a single pane of glass. Track revenue, orders, and staff performance across every outlet simultaneously.",
        Mockup: MultiLocationMockup,
    },
    {
        title: "Live Kitchen Display System (KDS)",
        desc: "Eliminate paper tickets with a live KDS. Orders flow in real-time from POS to kitchen with status tracking from new → preparing → ready.",
        Mockup: KitchenDisplayMockup,
    },
];

/* ─── Hero Component ───────────────────────────────── */

export function Hero() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeSlide, setActiveSlide] = useState(0);
    const cardWidth = 390 + 24;

    const scrollTo = useCallback((index: number) => {
        const clamped = Math.max(0, Math.min(index, slides.length - 1));
        setActiveSlide(clamped);
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ left: clamped * cardWidth, behavior: "smooth" });
        }
    }, [cardWidth]);

    const handlePrev = () => scrollTo(activeSlide - 1);
    const handleNext = () => scrollTo(activeSlide + 1);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        setActiveSlide(Math.round(scrollRef.current.scrollLeft / cardWidth));
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener("scroll", handleScroll, { passive: true });
        return () => el.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div
            className="pt-[120px] pb-[80px] font-sans overflow-hidden"
            style={{
                backgroundImage: "radial-gradient(at 47% 41%, #d2b8ff 0, transparent 50%), radial-gradient(at 17% 100%, #ffdbde 0, transparent 50%), radial-gradient(at 84% 49%, #bdd5ff 0, transparent 50%), radial-gradient(at 14% 88%, #eadbff 0, transparent 50%), radial-gradient(at 0 0, #e6e6ff 0, transparent 50%)",
                backgroundColor: "#ffffff"
            }}
        >
            <div className="py-10">
                {/* Headline */}
                <div className="max-w-[1440px] mx-auto mb-20 gap-8 px-2 md:px-16">
                    <h1 className="leading-[55px] text-center">
                        <span className="text-[30px] md:text-[48px] font-semibold text-gray-900 tracking-tight">
                            Making Retail Operations
                        </span>
                        <br />
                        <span className="text-[30px] md:text-[48px] lg:text-[4rem] font-bold bg-[linear-gradient(90deg,#1E71D1_0%,#3A6AD3_10.29%,#5C62D5_17.55%,#7B5BD6_24.54%,#9455D8_29.56%,#A34FCD_37.34%,#AB4CBD_42.22%,#AF4BB6_47.47%,#B547A8_53.77%,#B9459E_58.36%,#BD4398_61.6%,#C14291_64.49%,#C3408B_68.91%,#CB3D7B_76.06%,#D2396C_82.53%,#DA375D_89.33%,#D63D3A_96.71%)] bg-clip-text text-transparent tracking-tight">
                            Intelligent. Resilient. Compliant.
                        </span>
                    </h1>
                    <p className="text-[18px] md:text-[20px] text-gray-800 font-medium max-w-2xl m-auto text-center mt-6 leading-relaxed">
                        Neqtra POS is a single source of truth for retail and restaurant operations that connects millions of transaction data points and empowers your team.
                    </p>
                </div>

                {/* Slider */}
                <div className="relative w-full max-w-[1600px] mx-auto">
                    {/* Cards */}
                    <div
                        ref={scrollRef}
                        className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory px-4 md:px-8 lg:px-28 pb-4 [&::-webkit-scrollbar]:hidden"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                        {slides.map((slide, idx) => {
                            const { Mockup } = slide;
                            return (
                                <div key={idx} className="flex-none w-[390px] snap-center">
                                    <div className="relative group cursor-pointer w-full h-[473px] overflow-hidden rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.10)] border border-gray-200/60">
                                        {/* Mockup fills full card */}
                                        <Mockup />

                                        {/* Hover overlay with text */}
                                        <div className="absolute bottom-0 left-0 w-full h-full bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.97)_55%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <div className="absolute inset-0 p-6 flex flex-col justify-end transform translate-y-[35%] group-hover:translate-y-0 transition-transform duration-500 ease-out">
                                                <h3 className="text-[18px] font-bold text-gray-900 mb-2 leading-snug">
                                                    {slide.title}
                                                </h3>
                                                <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                                                    {slide.desc}
                                                </p>
                                                <div className="flex items-center text-sm font-bold gap-1 text-indigo-600">
                                                    <span className="underline underline-offset-2">Learn More</span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 -960 960 960" fill="#6366f1" className="animate-bounce mt-0.5">
                                                        <path d="M480-288 288-480l51-51 105 105v-294h72v294l105-105 51 51-192 192Z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Controls: ← dots → */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <button
                            onClick={handlePrev}
                            disabled={activeSlide === 0}
                            className="w-10 h-10 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center text-gray-700 hover:text-black hover:shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2">
                            {slides.map((_, idx) => (
                                <button
                                    key={idx}
                                    aria-label={`Go to slide ${idx + 1}`}
                                    onClick={() => scrollTo(idx)}
                                    className={`transition-all duration-300 rounded-full h-3 ${idx === activeSlide ? "w-8 bg-black" : "w-3 bg-gray-300 hover:bg-gray-600"}`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={handleNext}
                            disabled={activeSlide === slides.length - 1}
                            className="w-10 h-10 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center text-gray-700 hover:text-black hover:shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Next slide"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
