import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { InventoryItem } from '../inventory/entities/inventory.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Table } from '../entities/table.entity';
import { Customer } from '../customers/entities/customer.entity';

import { Payment } from '../payments/entities/payment.entity';
import { Salary } from '../entities/salary.entity';

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
    @InjectRepository(Salary) private salaryRepo: Repository<Salary>,
  ) { }

  async getMetrics() {
    console.log("[DashboardService] Starting getMetrics...");
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      console.log("[DashboardService] Date set to:", today);

      // 1. Daily Sales
      let revenue = 0;
      let orderCount = 0;
      try {
        console.log("[DashboardService] Fetching today's orders...");
        const todayOrders = await this.orderRepo
          .createQueryBuilder('order')
          .where('order.createdAt >= :today', { today })
          .leftJoinAndSelect('order.items', 'items')
          .leftJoinAndSelect('items.menuItem', 'menuItem')
          .getMany();
        orderCount = todayOrders.length;
        revenue = todayOrders.reduce((sum, order) => {
          if (!order.items) return sum;
          const orderTotal = order.items.reduce((acc, item) => {
            const price = item.menuItem ? Number(item.menuItem.price) : 0;
            return acc + price * item.quantity;
          }, 0);
          return sum + orderTotal;
        }, 0);
      } catch (e: any) { console.warn("[DashboardService] Orders error:", e.message); }

      // 2. Low Stock Items
      let lowStockCount = 0;
      let lowStockItems: any[] = [];
      try {
        console.log("[DashboardService] Fetching low stock items...");
        const items = await this.inventoryRepo
          .createQueryBuilder('item')
          .where('item.quantity <= item.threshold')
          .getMany();
        lowStockItems = items.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity }));
        lowStockCount = items.length;
      } catch (e: any) { console.warn("[DashboardService] Inventory error:", e.message); }

      // 3. Today's Reservations
      let reservationCount = 0;
      try {
        console.log("[DashboardService] Fetching upcoming reservations...");
        const upcomingReservations = await this.reservationRepo
          .createQueryBuilder('res')
          .where('res.date >= :today', { today })
          .andWhere('res.status = :status', { status: 'PENDING' })
          .getMany();
        reservationCount = upcomingReservations.length;
      } catch (e: any) { console.warn("[DashboardService] Reservations error:", e.message); }

      // 4. Occupied Tables
      let occupiedTables = 0;
      try {
        console.log("[DashboardService] Fetching occupied tables...");
        const tables = await this.tableRepo.findBy({ status: 'OCCUPIED' });
        occupiedTables = tables.length;
      } catch (e: any) { console.warn("[DashboardService] Tables error:", e.message); }

      // 5. Total Outstanding Dues
      let totalDues = 0;
      try {
        console.log("[DashboardService] Fetching total dues...");
        const customers = await this.customerRepo.find();
        totalDues = customers.reduce((sum, c) => sum + (c.totalDue || 0), 0);
      } catch (e: any) { console.warn("[DashboardService] Customers error:", e.message); }

      // 6. Payment Breakdown (Today)
      let paymentStats: any[] = [];
      try {
        console.log("[DashboardService] Fetching payment stats...");
        const stats = await this.paymentRepo
          .createQueryBuilder('p')
          .select('p.method', 'method')
          .addSelect('SUM(p.amount)', 'total')
          .where('p.createdAt >= :today', { today })
          .groupBy('p.method')
          .getRawMany();
        paymentStats = stats.map((s) => ({ method: s.method, total: Number(s.total) }));
      } catch (e: any) { console.warn("[DashboardService] Payments error:", e.message); }

      // 7. Salaries (Current Month)
      let totalSalariesPaid = 0;
      let totalAdvancesPaid = 0;
      try {
        console.log("[DashboardService] Fetching salaries for this month...");
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const currentMonthStr = `${monthNames[today.getMonth()]} ${today.getFullYear()}`;
        
        const salariesThisMonth = await this.salaryRepo.findBy({ paymentMonth: currentMonthStr });
        
        // Summing up by type
        totalSalariesPaid = salariesThisMonth
          .filter(s => s.type === 'REGULAR')
          .reduce((sum, s) => sum + Number(s.amount), 0);
          
        totalAdvancesPaid = salariesThisMonth
          .filter(s => s.type === 'ADVANCE')
          .reduce((sum, s) => sum + Number(s.amount), 0);
          
      } catch (e: any) { console.warn("[DashboardService] Salaries error:", e.message); }

      const result = {
        dailyRevenue: revenue,
        orderCount,
        lowStockCount,
        lowStockItems,
        reservationCount,
        occupiedTables,
        totalDues,
        totalSalariesPaid,
        totalAdvancesPaid,
        paymentStats,
      };

      console.log("[DashboardService] Metrics compilation successful.");
      return result;
    } catch (error) {
      console.error("[DashboardService] FATAL ERROR in getMetrics:", error);
      return {
        dailyRevenue: 0,
        orderCount: 0,
        lowStockCount: 0,
        lowStockItems: [],
        reservationCount: 0,
        occupiedTables: 0,
        totalDues: 0,
        totalSalariesPaid: 0,
        totalAdvancesPaid: 0,
        paymentStats: [],
      };
    }
  }
}
