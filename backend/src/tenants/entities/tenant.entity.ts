import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { User } from '../../entities/user.entity';

@Entity('tenants')
export class Tenant {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ unique: true, nullable: true })
    subdomain: string;

    @Column({ default: 'ACTIVE' }) // ACTIVE, INACTIVE, SUSPENDED
    status: string;

    @Column({ default: 'FREE' }) // FREE, STARTER, PRO, ENTERPRISE
    subscriptionPlan: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ default: 'USD' })
    currency: string;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    taxRate: number;

    @Column({ nullable: true })
    stripeCustomerId: string;

    @Column({ nullable: true })
    stripeSubscriptionId: string;

    @Column({ default: 10 })
    maxUsers: number;

    @Column({ default: 20 })
    maxTables: number;

    @Column({ default: 1 })
    maxDevices: number;

    @Column({ default: 1 })
    maxBranches: number;

    @Column({ type: 'jsonb', default: { inventory: true, analytics: false, advancedReports: false } })
    features: any;

    @Column({ nullable: true })
    billingEmail: string;

    @Column({ type: 'timestamp', nullable: true })
    nextBillingDate: Date;

    @Column({ type: 'timestamp', nullable: true })
    trialEndsAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    subscriptionExpiry: Date;

    @Column({ type: 'jsonb', nullable: true })
    metadata: any;

    @OneToMany(() => Branch, (branch) => branch.tenant)
    branches: Branch[];

    @OneToMany(() => User, (user) => user.tenant)
    users: User[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
