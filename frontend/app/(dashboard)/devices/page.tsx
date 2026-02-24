"use client";

import { useEffect, useState } from 'react';
import { DevicesService, Device } from '@/services/devices.service';
import { Monitor, Ban, CheckCircle } from 'lucide-react';
import { getDeviceId } from '@/lib/deviceId';

export default function DevicesPage() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [currentDeviceId, setCurrentDeviceId] = useState('');

    useEffect(() => {
        setCurrentDeviceId(getDeviceId());
        DevicesService.getAllDevices()
            .then(setDevices)
            .finally(() => setLoading(false));
    }, [refreshTrigger]);

    const handleRevoke = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to revoke access for "${name}"? This device will be logged out globally.`)) return;
        try {
            await DevicesService.revokeDevice(id);
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error('Failed to revoke device:', error);
            alert('Failed to revoke device');
        }
    };

    if (loading) return (
        <div className="p-8 pb-32 max-w-7xl mx-auto flex items-center justify-center min-h-[50vh]">
            <div className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        </div>
    );

    return (
        <div className="p-8 pb-32 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold font-serif italic text-foreground mb-2 shadow-sm inline-block">Device Management</h1>
                <p className="text-muted text-sm max-w-2xl">
                    Manage the hardware and browsers that are currently authenticated to access your POS system. Revoking a device will force it to sign out.
                </p>
            </div>

            <div className="bg-surface rounded-2xl border border-surface-light overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-foreground">
                        <thead className="text-xs uppercase bg-surface-light/50 text-muted">
                            <tr>
                                <th scope="col" className="px-6 py-4">Device Name</th>
                                <th scope="col" className="px-6 py-4">Status</th>
                                <th scope="col" className="px-6 py-4">Last Active</th>
                                <th scope="col" className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-light">
                            {devices.map((device) => {
                                const isCurrent = device.identifier === currentDeviceId;
                                return (
                                    <tr key={device.id} className="hover:bg-surface-light/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                                    <Monitor className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-bold flex items-center gap-2">
                                                        {device.name}
                                                        {isCurrent && (
                                                            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                                Current Session
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted font-mono">{device.identifier.substring(0, 12)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {device.status === 'ACTIVE' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-600">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-destructive/10 text-destructive">
                                                    <Ban className="w-3.5 h-3.5" />
                                                    Revoked
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-muted">
                                            {new Date(device.lastActive || device.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {device.status === 'ACTIVE' && (
                                                <button
                                                    onClick={() => handleRevoke(device.id, device.name)}
                                                    className="font-bold text-sm text-destructive hover:text-red-900 transition-colors"
                                                >
                                                    Revoke Access
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {devices.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-muted">
                                        No devices found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
