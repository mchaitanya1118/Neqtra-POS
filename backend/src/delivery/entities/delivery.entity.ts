import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

@Entity('deliveries')
export class Delivery {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    driverName: string;

    @Column({ nullable: true })
    driverPhone: string;

    @Column()
    address: string;

    @Column({
        type: 'enum',
        enum: ['PENDING', 'ASSIGNED', 'PICKED_UP', 'DELIVERED', 'CANCELLED'],
        default: 'PENDING',
    })
    status: string;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    deliveryFee: number;

    @OneToOne(() => Order, { cascade: true, onDelete: 'CASCADE' })
    @JoinColumn()
    order: Order;

    @Column()
    orderId: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
