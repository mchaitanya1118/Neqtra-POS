import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  method: string; // CASH, CARD, UPI, DUE, WALLET

  @Column({ nullable: true })
  transactionId: string;

  @Column({ default: 'COMPLETED' })
  status: string; // PENDING, COMPLETED, FAILED, REFUNDED

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Order, (order) => order.payments, { onDelete: 'CASCADE' })
  order: Order;
}
