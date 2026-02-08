import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { Payment } from './payment.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  tableName: string;

  @Column({ default: 'PENDING' }) // PENDING, CONFIRMED, COMPLETED, CANCELLED
  status: string;

  @Column({ default: 'DINE_IN' })
  type: string; // DINE_IN, DELIVERY, PICK_UP

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ default: 'FIXED' })
  discountType: string; // FIXED or PERCENT

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  customerId: number;

  @OneToMany(() => Payment, (payment) => payment.order, { cascade: true })
  payments: Payment[];
}
