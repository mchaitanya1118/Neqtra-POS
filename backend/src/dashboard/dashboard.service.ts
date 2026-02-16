import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { InventoryItem } from '../inventory/entities/inventory.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Table } from '../entities/table.entity';
import { Customer } from '../customers/entities/customer.entity';

import { Payment } from '../orders/entities/payment.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(InventoryItem)
    private inventoryRepo: Repository<InventoryItem>,
    @InjectRepository(Reservation)
    private reservationRepo: Repository<Reservation>,
    @InjectRepository(Table) private tableRepo: Repository<Table>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
  ) { }

  async getMetrics() {
    console.log("[DashboardService] Starting getMetrics...");
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      console.log("[DashboardService] Date set to:", today);

      // 1. Daily Sales
      console.log("[DashboardService] Fetching today's orders...");
      const todayOrders = await this.orderRepo
        .createQueryBuilder('order')
        .where('order.createdAt >= :today', { today })
        .leftJoinAndSelect('order.items', 'items')
        .leftJoinAndSelect('items.menuItem', 'menuItem')
        .getMany();
      console.log(`[DashboardService] Found ${todayOrders.length} orders today.`);

      const revenue = todayOrders.reduce((sum, order) => {
        if (!order.items) return sum;
        const orderTotal = order.items.reduce((acc, item) => {
          // Safety check: if menuItem is null (e.g. deleted), use 0 or fallback
          const price = item.menuItem ? Number(item.menuItem.price) : 0;
          return acc + price * item.quantity;
        }, 0);
        return sum + orderTotal;
      }, 0);
      console.log(`[DashboardService] Calculated revenue: ${revenue}`);

      // 2. Low Stock Items
      console.log("[DashboardService] Fetching low stock items...");
      const lowStockItems = await this.inventoryRepo
        .createQueryBuilder('item')
        .where('item.quantity <= item.threshold')
        .getMany();
      console.log(`[DashboardService] Found ${lowStockItems.length} low stock items.`);

      // 3. Today's Reservations
      console.log("[DashboardService] Fetching upcoming reservations...");
      const upcomingReservations = await this.reservationRepo
        .createQueryBuilder('res')
        .where('res.date >= :today', { today })
        .andWhere('res.status = :status', { status: 'PENDING' })
        .getMany();
      console.log(`[DashboardService] Found ${upcomingReservations.length} upcoming reservations.`);

      // 4. Occupied Tables
      console.log("[DashboardService] Fetching occupied tables...");
      const occupiedTables = await this.tableRepo.findBy({ status: 'OCCUPIED' });
      console.log(`[DashboardService] Found ${occupiedTables.length} occupied tables.`);

      // 5. Total Outstanding Dues
      console.log("[DashboardService] Fetching total dues...");
      const customers = await this.customerRepo.find();
      const totalDues = customers.reduce((sum, c) => sum + (c.totalDue || 0), 0);
      console.log(`[DashboardService] Total dues calculated: ${totalDues}`);

      // 6. Payment Breakdown (Today)
      console.log("[DashboardService] Fetching payment stats...");
      const paymentStats = await this.paymentRepo
        .createQueryBuilder('p')
        .select('p.method', 'method')
        .addSelect('SUM(p.amount)', 'total')
        .where('p.createdAt >= :today', { today })
        .groupBy('p.method')
        .getRawMany();
      console.log(`[DashboardService] Payment stats fetched:`, paymentStats);

      const result = {
        dailyRevenue: revenue,
        orderCount: todayOrders.length,
        lowStockCount: lowStockItems.length,
        lowStockItems: lowStockItems.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
        })),
        reservationCount: upcomingReservations.length,
        occupiedTables: occupiedTables.length,
        totalDues: totalDues,
        paymentStats: paymentStats.map((s) => ({
          method: s.method,
          total: Number(s.total),
        })),
      };

      console.log("[DashboardService] Metrics compilation successful.");
      return result;
    } catch (error) {
      console.error("[DashboardService] FATAL ERROR in getMetrics:", error);
      // Return zeroed/safe data instead of crashing the request
      return {
        dailyRevenue: 0,
        orderCount: 0,
        lowStockCount: 0,
        lowStockItems: [],
        reservationCount: 0,
        occupiedTables: 0,
        totalDues: 0,
        paymentStats: [],
      };
    }
  }
}
