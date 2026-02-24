import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_events')
export class OrderEvent {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Order, (order) => order.events, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'orderId' })
    order: Order;

    @Column()
    orderId: number;

    @Column()
    status: string;

    @Column({ nullable: true })
    previousStatus: string;

    @Column({ nullable: true })
    comment: string;

    @Column({ nullable: true })
    createdBy: string; // User ID or Name

    @CreateDateColumn()
    createdAt: Date;
}
