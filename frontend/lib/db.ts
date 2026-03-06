
import Dexie, { Table } from 'dexie';

export interface Product {
    id: number;
    name: string;
    price: number;
    categoryId: number;
    tenantId: string;
    image?: string;
    description?: string;
    isVeg?: boolean;
}

export interface Category {
    id: number;
    name: string;
    tenantId: string;
}

export interface Order {
    id?: number; // Auto-incremented local ID
    tempId: string; // Client-side unique ID
    items: any[];
    totalAmount: number;
    status: 'PENDING' | 'SYNCED' | 'FAILED' | 'PARKED';
    createdAt: Date;
    tenantId: string;
    branchId?: string;
    tableId?: number;
    tableName?: string;
    type?: string;
}

export class OfflineDB extends Dexie {
    products!: Table<Product>;
    categories!: Table<Category>;
    orders!: Table<Order>;

    constructor() {
        super('NeqtraPOS_DB');
        this.version(2).stores({ // Bumped version
            products: 'id, name, categoryId, tenantId',
            categories: 'id, name, tenantId',
            orders: '++id, status, tenantId, tempId, createdAt'
        });
    }
}

export const db = new OfflineDB();
