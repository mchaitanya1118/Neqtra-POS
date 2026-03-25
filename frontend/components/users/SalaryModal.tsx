"use client";

import { useState, useEffect } from "react";
import { User } from "@/store/useUserStore";
import { useSalaryStore } from "@/store/useSalaryStore";
import { X, DollarSign, Calendar, CreditCard, AlignLeft, ChevronDown, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SalaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    user?: User | null;
}

const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Cheque", "Mobile Money"];
const MONTHS = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
];

export function SalaryModal({ isOpen, onClose, user }: SalaryModalProps) {
    const { addSalary, error: storeError, salaries } = useSalaryStore();
    
    const currentYear = new Date().getFullYear();
    const currentMonth = MONTHS[new Date().getMonth()];
    
    const [amount, setAmount] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
    const [paymentType, setPaymentType] = useState<'REGULAR' | 'ADVANCE'>('REGULAR');
    const [month, setMonth] = useState(`${currentMonth} ${currentYear}`);
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [advancesThisMonth, setAdvancesThisMonth] = useState(0);

    // Auto-fill amount when modal opens for a user with fixed salary, ONLY if it's a regular salary
    useEffect(() => {
        let calculatedAdvances = 0;
        if (user && isOpen && salaries && salaries.length > 0) {
            calculatedAdvances = salaries
                .filter(s => String(s.user?.id || s.userId) === String(user.id) && s.type === 'ADVANCE' && s.paymentMonth === month)
                .reduce((sum, s) => sum + Number(s.amount), 0);
            setAdvancesThisMonth(calculatedAdvances);
        }

        if (isOpen && user?.fixedSalary && paymentType === 'REGULAR') {
            const netAmount = Math.max(0, user.fixedSalary - calculatedAdvances);
            setAmount(netAmount.toString());
        } else if (!isOpen) {
            setAmount("");
            setNote("");
            setError(null);
            setPaymentType('REGULAR');
            setMonth(`${MONTHS[new Date().getMonth()]} ${new Date().getFullYear()}`);
            setAdvancesThisMonth(0);
        } else if (isOpen && paymentType === 'ADVANCE') {
            setAmount(""); // Advances don't usually map to the full fixed salary
        }
    }, [isOpen, user, paymentType, month, salaries]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        setError(null);
        setIsSubmitting(true);

        try {
            await addSalary({
                userId: user.id,
                amount: Number(amount),
                paymentDate: new Date().toISOString(),
                paymentMonth: month,
                paymentMethod,
                type: paymentType,
                referenceNote: note || undefined
            });
            onClose();
        } catch (err) {
            setError(storeError || "Failed to log salary payment");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-surface border border-surface-light rounded-3xl md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
                    >
                        <div className="p-6 md:p-8 border-b border-surface-light flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold dark:text-white">Log Payment</h2>
                                    <p className="text-xs text-muted mt-1 tracking-wider uppercase font-bold text-primary">For {user.name}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-surface-light rounded-full transition-colors text-muted hover:text-foreground">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <div className="flex bg-surface-light/30 border border-surface-light/50 p-1 rounded-2xl w-full">
                                <button
                                    type="button"
                                    onClick={() => setPaymentType('REGULAR')}
                                    className={cn(
                                        "flex-1 py-2.5 text-xs font-bold transition-all rounded-xl",
                                        paymentType === 'REGULAR' ? "bg-primary text-black shadow-md" : "text-muted hover:text-foreground"
                                    )}
                                >
                                    Regular Salary
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentType('ADVANCE')}
                                    className={cn(
                                        "flex-1 py-2.5 text-xs font-bold transition-all rounded-xl",
                                        paymentType === 'ADVANCE' ? "bg-orange-500 text-black shadow-md" : "text-muted hover:text-foreground"
                                    )}
                                >
                                    Salary Advance
                                </button>
                            </div>

                            <AnimatePresence>
                                {paymentType === 'REGULAR' && advancesThisMonth > 0 && user?.fixedSalary && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-4 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-2xl text-sm font-medium leading-relaxed">
                                            <span className="font-bold flex items-center gap-2 mb-1">
                                                <CheckCircle className="w-4 h-4" /> Advance Settled
                                            </span>
                                                                                        ${(Number(advancesThisMonth) || 0).toFixed(2)} in prior advances for {month} has been automatically deducted from the base salary of ${user?.fixedSalary ? Number(user.fixedSalary).toFixed(2) : '0.00'}.
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Payment Amount</label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary font-bold text-xl transition-colors">$</div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full pl-12 pr-6 py-4 bg-surface-light/30 border border-surface-light/50 rounded-2xl focus:outline-none focus:ring-2 ring-primary/20 focus:border-primary transition-all dark:text-white text-xl font-bold"
                                        placeholder="0.00"
                                    />
                                    {user.hourlyRate && !user.fixedSalary && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-1 rounded-lg">
                                            ${user.hourlyRate}/Hr
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Salary Month</label>
                                    <div className="relative group">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors pointer-events-none" />
                                        <select
                                            value={month}
                                            onChange={(e) => setMonth(e.target.value)}
                                            className="w-full pl-10 pr-10 py-3.5 bg-surface-light/30 border border-surface-light/50 rounded-2xl focus:outline-none focus:ring-2 ring-primary/20 focus:border-primary transition-all dark:text-white appearance-none text-sm font-medium cursor-pointer"
                                        >
                                            {MONTHS.map(m => (
                                                <option key={m} value={`${m} ${currentYear}`}>{`${m} ${currentYear}`}</option>
                                            ))}
                                            {MONTHS.map(m => (
                                                <option key={`${m} ${currentYear - 1}`} value={`${m} ${currentYear - 1}`}>{`${m} ${currentYear - 1}`}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Method</label>
                                    <div className="relative group">
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors pointer-events-none" />
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full pl-10 pr-10 py-3.5 bg-surface-light/30 border border-surface-light/50 rounded-2xl focus:outline-none focus:ring-2 ring-primary/20 focus:border-primary transition-all dark:text-white appearance-none text-sm font-medium cursor-pointer"
                                        >
                                            {PAYMENT_METHODS.map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Reference Notes (Optional)</label>
                                <div className="relative group">
                                    <AlignLeft className="absolute left-4 top-4 w-4 h-4 text-muted group-focus-within:text-primary transition-colors pointer-events-none" />
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        rows={3}
                                        className="w-full pl-11 pr-4 py-3.5 bg-surface-light/30 border border-surface-light/50 rounded-2xl focus:outline-none focus:ring-2 ring-primary/20 focus:border-primary transition-all dark:text-white text-sm resize-none"
                                        placeholder="e.g. Paid in full for March + overtime bonus"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex gap-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-4 bg-surface-light hover:bg-surface-light/80 text-foreground font-bold rounded-2xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !amount || Number(amount) <= 0}
                                    className="flex-[2] py-4 bg-green-500 hover:bg-green-400 text-black font-bold rounded-2xl shadow-lg shadow-green-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? "Processing..." : (
                                        <>
                                            <CheckCircle className="w-5 h-5" /> Mark as Paid
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
