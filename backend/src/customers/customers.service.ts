import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';
import { DuesPayment } from './entities/dues-payment.entity';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private repo: Repository<Customer>,
    @InjectRepository(DuesPayment)
    private paymentRepo: Repository<DuesPayment>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
  ) {}

  // ... (create, findAll, findOne, update, remove - keep identical)

  create(createDto: CreateCustomerDto) {
    const customer = this.repo.create(createDto);
    return this.repo.save(customer);
  }

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findOne(id: number) {
    return this.repo.findOneBy({ id });
  }

  update(id: number, updateDto: UpdateCustomerDto) {
    return this.repo.update(id, updateDto);
  }

  remove(id: number) {
    return this.repo.delete(id);
  }

  async settleDue(id: number, amount: number) {
    const customer = await this.findOne(id);
    if (!customer) throw new NotFoundException('Customer not found');

    // Create payment record
    const payment = this.paymentRepo.create({
      amount: amount,
      customer: customer,
      type: 'PAYMENT',
      description: 'Payment Recieved',
    });
    await this.paymentRepo.save(payment);

    customer.totalDue = Math.max(0, customer.totalDue - amount);
    return this.repo.save(customer);
  }

  async addDue(id: number, amount: number) {
    const customer = await this.findOne(id);
    if (!customer) throw new NotFoundException('Customer not found');

    const payment = this.paymentRepo.create({
      amount: amount,
      customer: customer,
      type: 'CHARGE',
      description: 'Manual Charge',
    });
    await this.paymentRepo.save(payment);

    customer.totalDue += amount;
    return this.repo.save(customer);
  }

  async getHistory(id: number) {
    const customer = await this.findOne(id);
    if (!customer) throw new NotFoundException('Customer not found');

    // Fetch Payments (Credits)
    const payments = await this.paymentRepo.find({
      where: { customer: { id } },
      order: { date: 'DESC' },
    });

    // Fetch Orders (Debts) - Orders where customerId matches and maybe status != 'CANCELLED'
    const orders = await this.orderRepo.find({
      where: { customerId: id },
      order: { createdAt: 'DESC' },
    });

    // Normalize and Combine
    const history = [
      ...payments.map((p) => ({
        id: `P-${p.id}`,
        type: p.type,
        amount: Number(p.amount),
        date: p.date,
        description: p.description || 'Transaction',
      })),
      ...orders.map((o) => ({
        id: `O-${o.id}`,
        type: 'ORDER',
        amount: Number(o.totalAmount),
        date: o.createdAt,
        description: `Order #${o.id} - ${o.tableName}`,
      })),
    ];

    // Sort Descending by Date
    return history.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }
  async getDuesReport() {
    // Total Dues
    const result = await this.repo
      .createQueryBuilder('customer')
      .select('SUM(customer.totalDue)', 'total')
      .getRawOne();

    const totalDues = result ? parseFloat(result.total) : 0;

    // Top Debtors
    const topDebtors = await this.repo.find({
      where: {}, // Filter where totalDue > 0 if possible, but for now all
      order: { totalDue: 'DESC' },
      take: 5,
    });

    return { totalDues, topDebtors };
  }

  async getDuesTransactions() {
    // Fetch all payments/charges history
    const payments = await this.paymentRepo.find({
      relations: ['customer'],
      order: { date: 'DESC' },
      take: 50, // Limit for recent history
    });

    return payments.map((p) => ({
      id: p.id,
      customerName: p.customer.name,
      type: p.type,
      amount: Number(p.amount),
      description: p.description,
      date: p.date,
    }));
  }
}
