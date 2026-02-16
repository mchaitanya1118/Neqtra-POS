import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { Payment } from '../orders/entities/payment.entity';
import { Expense } from '../expenses/entities/expense.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(Expense)
    private expenseRepo: Repository<Expense>,
  ) { }

  async getChartData(query: { start?: string; end?: string }) {
    // Group by day for the chart
    // Using simple JS post-processing to avoid DB-specific constraints for now, 
    // but ideally use DB grouping. Given Order entity has createdAt...

    const qb = this.orderRepo.createQueryBuilder('o')
      .select("TO_CHAR(o.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('SUM(o.totalAmount)', 'revenue')
      .addSelect('COUNT(o.id)', 'orders')
      .groupBy("TO_CHAR(o.createdAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC');

    if (query.start) qb.andWhere('o.createdAt >= :start', { start: query.start });
    if (query.end) qb.andWhere('o.createdAt <= :end', { end: query.end });

    const result = await qb.getRawMany();

    // Fill gaps? For now, let frontend handle or just show what we have.
    return result.map(r => ({
      date: r.date,
      revenue: parseFloat(r.revenue),
      orders: parseInt(r.orders, 10)
    }));
  }

  async getSales(query: { start?: string; end?: string }) {
    try {
      const createQb = () => {
        const qb = this.orderRepo.createQueryBuilder('o');
        if (query.start)
          qb.andWhere('o.createdAt >= :start', { start: query.start });
        if (query.end) qb.andWhere('o.createdAt <= :end', { end: query.end });
        return qb;
      };

      const revenueQb = createQb();
      const result = await revenueQb
        .select('SUM(o.totalAmount)', 'sum')
        .getRawOne();

      const countQb = createQb();
      const orderCount = await countQb.getCount();

      // Get recent orders
      const listQb = createQb();
      const recentOrders = await listQb
        .orderBy('o.createdAt', 'DESC')
        .take(10)
        .getMany();

      // Payment Breakdown
      const paymentQb = this.paymentRepo.createQueryBuilder('p');
      if (query.start)
        paymentQb.andWhere('p.createdAt >= :start', { start: query.start });
      if (query.end)
        paymentQb.andWhere('p.createdAt <= :end', { end: query.end });

      const paymentStats = await paymentQb
        .select('p.method', 'method')
        .addSelect('SUM(p.amount)', 'total')
        .groupBy('p.method')
        .getRawMany();

      return {
        totalRevenue: Number(result?.sum || 0),
        orderCount,
        recentOrders,
        paymentStats: paymentStats.map((s) => ({
          method: s.method,
          total: Number(s.total),
        })),
      };
    } catch (error) {
      console.error('ReportsService Error:', error);
      throw error;
    }
  }
  async getDailyPnL(year: number, month: number) {
    // Construct Date Range for the full month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Revenue by Date
    // Note: Assuming PostgreSQL. If SQLite, date functions differ.
    // For wider compatibility or SQLite, we might use simple strings,
    // but here assuming Postgres 'TO_CHAR' or generic string matching.
    // Actually, let's use TypeORM's generic way or just JS processing if dataset is small?
    // No, better to group in DB.

    // Postgres: TO_CHAR(created_at, 'YYYY-MM-DD')
    // SQLite: strftime('%Y-%m-%d', created_at)

    // Let's assume Postgres for now given "hostinger vps coolify" context usually implies Docker/Postgres.
    // If it fails, I'll switch.

    const revenueData = await this.orderRepo
      .createQueryBuilder('order')
      .select("TO_CHAR(order.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('SUM(order.totalAmount)', 'revenue')
      .where('order.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .andWhere('order.status IN (:...statuses)', {
        statuses: ['COMPLETED', 'DUE'],
      })
      .groupBy("TO_CHAR(order.createdAt, 'YYYY-MM-DD')")
      .getRawMany();

    const expenseData = await this.expenseRepo
      .createQueryBuilder('expense')
      .select("TO_CHAR(expense.date, 'YYYY-MM-DD')", 'date')
      .addSelect('SUM(expense.amount)', 'expense')
      .where('expense.date BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .groupBy("TO_CHAR(expense.date, 'YYYY-MM-DD')")
      .getRawMany();

    // Map to full calendar
    const results: {
      date: string;
      revenue: number;
      expense: number;
      profit: number;
    }[] = [];
    const daysInMonth = endDate.getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month - 1, i);
      // Format to YYYY-MM-DD. Note: d.toISOString() uses UTC.
      // We want local date string.
      const dateStr = [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0'),
      ].join('-');

      const revenueItem = revenueData.find((r) => r.date === dateStr);
      const expenseItem = expenseData.find((e) => e.date === dateStr);

      const revenue = revenueItem ? parseFloat(revenueItem.revenue) : 0;
      const expense = expenseItem ? parseFloat(expenseItem.expense) : 0;

      results.push({
        date: dateStr,
        revenue,
        expense,
        profit: revenue - expense,
      });
    }

    return results;
  }
}
