import Dexie, { type Table } from 'dexie';

export interface Order {
    id?: number;
    tempId: string;
    items: any[];
    totalAmount: number;
    status: 'PARKED' | 'PENDING' | 'SYNCED' | 'FAILED';
    createdAt: Date;
    tenantId: string;
    branchId?: string;
    tableName?: string;
}

export interface CachedData {
    key: string;
    data: any;
    updatedAt: number;
}

export class NeqtraDB extends Dexie {
    orders!: Table<Order>;
    categories!: Table<any>;
    products!: Table<any>;
    cache!: Table<CachedData>;

    constructor() {
        super('NeqtraPOS');
        this.version(2).stores({
            orders: '++id, tempId, status, createdAt, tenantId',
            categories: 'id, tenantId',
            products: 'id, categoryId, tenantId',
            cache: 'key'
        });
    }
}

export const db = new NeqtraDB();
