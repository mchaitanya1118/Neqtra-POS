import { User } from "@/store/useUserStore";
import { useSalaryStore } from "@/store/useSalaryStore";
import { DollarSign, Clock, Calendar, Plus, CreditCard, Receipt, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface SalaryListProps {
    users: User[];
    onPaySalary: (user: User) => void;
}

export function SalaryList({ users, onPaySalary }: SalaryListProps) {
    const { salaries } = useSalaryStore();

    // Filter to only show users who are set up for salary tracking
    const staff = users.filter(u => u.hourlyRate || u.fixedSalary);

    return (
        <div className="space-y-6">
            {staff.length === 0 ? (
                <div className="text-center py-12 p-6 bg-surface border border-surface-light rounded-[32px]">
                    <DollarSign className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-bold dark:text-white mb-2">No Salary Profiles Found</h3>
                    <p className="text-muted text-sm max-w-sm mx-auto">
                        To manage salaries, please edit a staff member and assign them an Hourly Rate or Fixed Salary.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {staff.map((user) => {
                        const userHistory = salaries.filter(s => String(s.userId) === String(user.id));
                        
                        // Calculate total advances for current month
                        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                        const now = new Date();
                        const currentMonthStr = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
                        
                        const monthlyAdvances = userHistory
                            .filter(s => s.type === 'ADVANCE' && s.paymentMonth === currentMonthStr)
                            .reduce((sum, s) => sum + Number(s.amount), 0);
                        
                        return (
                            <div key={user.id} className="bg-surface border border-surface-light p-6 rounded-3xl hover:border-primary/50 transition-colors group flex flex-col h-full">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-surface-light flex items-center justify-center text-xl font-bold font-serif text-muted group-hover:bg-primary group-hover:text-black transition-colors">
                                            {user.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg dark:text-white leading-tight">{user.name}</h3>
                                            <p className="text-xs font-bold uppercase tracking-wider text-primary mt-1">{user.roleRel?.name || user.role}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => onPaySalary(user)}
                                        className="w-10 h-10 rounded-2xl bg-primary/10 text-primary hover:bg-primary hover:text-black flex items-center justify-center transition-all"
                                        title="Log Payment"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-surface-light/30 p-3 rounded-2xl">
                                        <div className="flex items-center gap-2 text-muted mb-1">
                                            <CreditCard className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Base Pay</span>
                                        </div>
                                        <p className="text-sm font-bold dark:text-white">
                                            {user.fixedSalary ? `$${user.fixedSalary}/mo` : `$${user.hourlyRate}/hr`}
                                        </p>
                                    </div>
                                    <div className="bg-surface-light/30 p-3 rounded-2xl">
                                        <div className="flex items-center gap-2 text-muted mb-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Shift</span>
                                        </div>
                                        <p className="text-sm font-bold dark:text-white">
                                            {user.shift || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="col-span-2 bg-orange-500/5 border border-orange-500/10 p-3 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-orange-400">
                                            <TrendingUp className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500/70">Advances (Current Month)</span>
                                        </div>
                                        <p className="text-sm font-black text-orange-500">
                                            ${monthlyAdvances.toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex-1 border-t border-surface-light pt-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                                            <Receipt className="w-4 h-4" /> 
                                            Recent Payouts
                                        </h4>
                                        <span className="text-xs font-bold text-primary">{userHistory.length} Total</span>
                                    </div>
                                    
                                    {userHistory.length === 0 ? (
                                        <div className="text-center py-4 bg-black/20 rounded-xl">
                                            <p className="text-xs text-muted">No payments logged yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {userHistory.slice(0, 3).map((salary) => (
                                                <div key={salary.id} className="flex items-center justify-between p-3 bg-surface-light/20 rounded-xl border border-surface-light/50">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-bold dark:text-white">${(Number(salary.amount) || 0).toLocaleString()}</p>
                                                            {salary.type === 'ADVANCE' ? (
                                                                <span className="px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-500 text-[9px] font-black uppercase tracking-wider border border-orange-500/20">Advance</span>
                                                            ) : (
                                                                <span className="px-1.5 py-0.5 rounded-md bg-green-500/10 text-green-500 text-[9px] font-black uppercase tracking-wider border border-green-500/20">Salary</span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted mt-0.5">{salary.paymentMonth}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-medium text-foreground">{salary.paymentMethod}</p>
                                                                                                                <p className="text-[10px] text-muted mt-0.5">
                                                            {(() => {
                                                                try {
                                                                    const d = new Date(salary.paymentDate);
                                                                    return isNaN(d.getTime()) ? 'Invalid Date' : format(d, 'MMM dd, yyyy');
                                                                } catch (e) {
                                                                    return 'Invalid Date';
                                                                }
                                                            })()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
}
