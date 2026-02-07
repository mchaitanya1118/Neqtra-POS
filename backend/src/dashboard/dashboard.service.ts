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
  ) {}

  async getMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Daily Sales
    const todayOrders = await this.orderRepo
      .createQueryBuilder('order')
      .where('order.createdAt >= :today', { today })
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.menuItem', 'menuItem')
      .getMany();

    const revenue = todayOrders.reduce((sum, order) => {
      const orderTotal = order.items.reduce(
        (acc, item) => acc + Number(item.menuItem.price) * item.quantity,
        0,
      );
      return sum + orderTotal;
    }, 0);

    // 2. Low Stock Items
    const lowStockItems = await this.inventoryRepo
      .createQueryBuilder('item')
      .where('item.quantity <= item.threshold')
      .getMany();

    // 3. Today's Reservations
    const upcomingReservations = await this.reservationRepo
      .createQueryBuilder('res')
      .where('res.date >= :today', { today })
      .andWhere('res.status = :status', { status: 'PENDING' })
      .getMany();

    // 4. Occupied Tables
    const occupiedTables = await this.tableRepo.findBy({ status: 'OCCUPIED' });

    // 5. Total Outstanding Dues
    const customers = await this.customerRepo.find();
    const totalDues = customers.reduce((sum, c) => sum + c.totalDue, 0);

    // 6. Payment Breakdown (Today)
    const paymentStats = await this.paymentRepo
      .createQueryBuilder('p')
      .select('p.method', 'method')
      .addSelect('SUM(p.amount)', 'total')
      .where('p.createdAt >= :today', { today })
      .groupBy('p.method')
      .getRawMany();

    return {
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
  }
}
