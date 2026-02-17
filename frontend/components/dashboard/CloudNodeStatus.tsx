"use client";

import React from 'react';
import { Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatusItemProps {
    label: string;
    active?: boolean;
}

const StatusItem = ({ label, active = true }: StatusItemProps) => (
    <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-muted uppercase tracking-[0.1em]">{label}</span>
        <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-bold text-foreground/90 tracking-wider">CONNECTED</span>
            <div className="relative flex items-center justify-center">
                <div className={cn(
                    "w-2 h-2 rounded-full",
                    active ? "bg-[#69D7BD]" : "bg-muted"
                )} />
                {active && (
                    <motion.div
                        animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute w-2 h-2 rounded-full bg-[#69D7BD] blur-[2px]"
                    />
                )}
            </div>
        </div>
    </div>
);

export function CloudNodeStatus() {
    return (
        <div className="bg-[#0D1212] border border-[#1A1E21] rounded-[32px] p-8 shadow-2xl relative overflow-hidden group hover:border-[#69D7BD]/20 transition-all duration-500">
            {/* Header */}
            <div className="flex items-center gap-5 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-[#69D7BD]/10 flex items-center justify-center relative shadow-[0_0_20px_rgba(105,215,189,0.1)] group-hover:shadow-[0_0_30px_rgba(105,215,189,0.2)] transition-shadow shrink-0">
                    <Activity className="w-7 h-7 text-[#69D7BD]" />
                    <div className="absolute inset-0 bg-[#69D7BD]/5 rounded-[24px] blur-lg opacity-50" />
                </div>
                <div className="min-w-0">
                    <h2 className="text-2xl font-bold font-serif italic text-white tracking-tight leading-tight truncate">Cloud Node</h2>
                    <p className="text-[10px] font-bold text-[#69D7BD] uppercase tracking-[0.2em] mt-0.5 opacity-90">Operational</p>
                </div>
            </div>

            {/* Connection Statuses */}
            <div className="space-y-6 mb-4">
                <StatusItem label="Database Gateway" />
                <StatusItem label="Websocket Uplink" />
                <StatusItem label="KDS Integration" />
                <StatusItem label="Payment Processor" />
            </div>

            {/* Divider */}
            <div className="h-[1px] bg-gradient-to-r from-transparent via-[#1A1E21] to-transparent mb-4" />

            {/* Runtime Duration */}
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted uppercase tracking-[0.15em]">Runtime Duration</span>
                <span className="text-base font-bold text-white tracking-widest font-mono">142:52:12</span>
            </div>
        </div>
    );
}
