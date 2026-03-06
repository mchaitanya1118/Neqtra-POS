"use client";

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const testimonials = [
    {
        quote: "Neqtra has completely transformed how we view our multi-location data. The compliance tools alone saved us thousands of hours.",
        author: "Sarah Jenkins",
        role: "Head of Retail Operations",
        company: "Global Brands Co."
    },
    {
        quote: "Real-time visibility into our supply chain and inventory was impossible before. Now we can track everything instantly with confidence.",
        author: "Markus V.",
        role: "Supply Chain Director",
        company: "AutoParts International"
    }
];

export function Testimonials() {
    return (
        <section className="py-24 bg-white border-t border-gray-100 font-sans">
            <div className="max-w-[1400px] mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-black mb-6">Explore <span className="text-[#6366F1]">Transformation Stories</span></h2>
                    <p className="text-gray-600 text-lg font-medium max-w-2xl mx-auto">
                        See how top retail chains use Neqtra to solve complex operational challenges and scale intelligently.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {testimonials.map((testimonial, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.2, duration: 0.5 }}
                            className="p-10 rounded-[24px] bg-white border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col justify-between hover:border-indigo-300 transition-colors"
                        >
                            <div>
                                <Quote className="w-10 h-10 text-indigo-400 opacity-50 mb-6" />
                                <p className="text-gray-900 text-[19px] leading-relaxed font-semibold mb-8">
                                    "{testimonial.quote}"
                                </p>
                            </div>
                            <div className="flex items-center gap-4 pt-6">
                                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-[#6366F1] font-bold text-lg border border-indigo-100">
                                    {testimonial.author.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-black font-bold text-[16px]">{testimonial.author}</h4>
                                    <p className="text-gray-500 text-[14px] font-medium">{testimonial.role}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
