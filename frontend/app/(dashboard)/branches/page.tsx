'use client';

import { useState, useEffect } from 'react';
import { BranchService } from '@/services/branch.service';
import { Store, Plus, Trash2, MapPin, Phone, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BranchesPage() {
    const [branches, setBranches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState('');
    const [newBranch, setNewBranch] = useState({ name: '', address: '', phone: '' });

    useEffect(() => {
        loadBranches();
    }, []);

    const loadBranches = async () => {
        setIsLoading(true);
        try {
            const data = await BranchService.getBranches();
            setBranches(data);
        } catch (err) {
            console.error('Failed to load branches', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newBranch.name) {
            setError('Branch name is required');
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            await BranchService.createBranch(newBranch);
            setNewBranch({ name: '', address: '', phone: '' });
            setIsAdding(false);
            await loadBranches();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to create branch');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this branch?')) return;
        setIsLoading(true);
        try {
            await BranchService.deleteBranch(id);
            await loadBranches();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to delete branch');
            setIsLoading(false);
        }
    };

    if (isLoading && !branches.length) {
        return <div className="flex h-full items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 p-4 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-surface/50 p-4 md:p-6 rounded-2xl border border-surface-light gap-4 md:gap-0">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                        <Store className="text-primary w-5 h-5 md:w-6 md:h-6 shrink-0" /> Branch Management
                    </h1>
                    <p className="text-muted text-xs md:text-sm mt-1">Manage multiple physical locations for your workspace.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="w-full md:w-auto justify-center px-4 py-3 md:py-2 bg-primary text-primary-fg font-bold rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0"
                >
                    <Plus className="w-5 h-5 shrink-0" /> <span className="whitespace-nowrap">Add Branch</span>
                </button>
            </div>

            {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" /> {error}
                </motion.div>
            )}

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-surface/50 border border-surface-light rounded-2xl p-4 md:p-6 space-y-4 mb-6">
                            <h3 className="font-bold border-b border-surface-light pb-2 text-sm md:text-base">New Branch Location</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                                <input
                                    placeholder="Branch Name (e.g. Downtown Cafe)"
                                    value={newBranch.name}
                                    onChange={e => setNewBranch({ ...newBranch, name: e.target.value })}
                                    className="bg-background border border-surface-light rounded-xl px-4 py-3 focus:border-primary focus:outline-none"
                                />
                                <input
                                    placeholder="Address"
                                    value={newBranch.address}
                                    onChange={e => setNewBranch({ ...newBranch, address: e.target.value })}
                                    className="bg-background border border-surface-light rounded-xl px-4 py-3 focus:border-primary focus:outline-none"
                                />
                                <input
                                    placeholder="Phone"
                                    value={newBranch.phone}
                                    onChange={e => setNewBranch({ ...newBranch, phone: e.target.value })}
                                    className="bg-background border border-surface-light rounded-xl px-4 py-3 focus:border-primary focus:outline-none"
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                                <button onClick={() => setIsAdding(false)} className="w-full sm:w-auto px-4 py-3 md:py-2 rounded-xl text-muted hover:bg-surface-light transition-colors font-bold text-sm">Cancel</button>
                                <button onClick={handleCreate} disabled={isLoading} className="w-full sm:w-auto justify-center px-6 py-3 md:py-2 rounded-xl font-bold bg-primary text-primary-fg hover:opacity-90 transition-colors flex items-center gap-2 text-sm">
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Store className="w-4 h-4 shrink-0" />} <span className="whitespace-nowrap">Save Branch</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {branches.map(branch => (
                    <div key={branch.id} className="bg-surface/30 border border-surface-light rounded-2xl p-5 md:p-6 space-y-4 hover:border-primary/50 transition-colors group">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-2">
                                <Store className="w-6 h-6" />
                            </div>
                            <button
                                onClick={() => handleDelete(branch.id)}
                                className="text-muted hover:text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100"
                                title="Delete Branch"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg truncate">{branch.name}</h3>
                            <div className="space-y-2 mt-4">
                                <div className="flex items-center gap-2 text-sm text-muted">
                                    <MapPin className="w-4 h-4" /> <span className="truncate">{branch.address || 'No address set'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted">
                                    <Phone className="w-4 h-4" /> <span className="truncate">{branch.phone || 'No phone set'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {!isAdding && branches.length === 0 && !isLoading && (
                    <div className="col-span-full border-2 border-dashed border-surface-light rounded-2xl p-12 text-center flex flex-col items-center justify-center text-muted">
                        <Store className="w-12 h-12 mb-4 opacity-50" />
                        <p>No branch locations found.</p>
                        <button onClick={() => setIsAdding(true)} className="mt-4 text-primary font-bold hover:underline">Create your first branch</button>
                    </div>
                )}
            </div>
        </div>
    );
}
