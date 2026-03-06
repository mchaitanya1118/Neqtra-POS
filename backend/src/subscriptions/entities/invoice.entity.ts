import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('invoices')
export class Invoice {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;

    @Column()
    tenantId: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ default: 'INR' })
    currency: string;

    @Column()
    status: string; // PAID, UNPAID, FAILED

    @Column()
    provider: string; // STRIPE, PHONEPE, RAZORPAY

    @Column({ nullable: true })
    providerTransactionId: string;

    @Column()
    planName: string;

    @Column({ type: 'timestamp', nullable: true })
    periodStart: Date;

    @Column({ type: 'timestamp', nullable: true })
    periodEnd: Date;

    @CreateDateColumn()
    createdAt: Date;
}
