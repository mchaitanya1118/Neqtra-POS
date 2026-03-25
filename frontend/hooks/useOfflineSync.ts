import { useState, useEffect } from 'react';
import { syncService } from '@/services/sync.service';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

export function useOfflineSync() {
    const [isOnline, setIsOnline] = useState(true);
    const pendingCount = useLiveQuery(() => db.orders.where('status').equals('PENDING').count()) || 0;

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            syncService.sync();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        setIsOnline(navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return {
        isOnline,
        pendingCount,
        syncNow: () => syncService.sync(),
    };
}
