import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Customer } from './customer.entity';

@Entity('dues_payments')
export class DuesPayment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @CreateDateColumn()
  date: Date;

  @Column({ default: 'PAYMENT' }) // PAYMENT, CHARGE
  type: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Customer, (customer) => customer.payments)
  customer: Customer;
}
