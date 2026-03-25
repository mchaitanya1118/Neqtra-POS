import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne } from 'typeorm';
import { Subscription } from './subscription.entity';
import { TenantSetting } from './tenant-setting.entity';

@Entity('tenants')
export class Tenant {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ unique: true, nullable: true })
    subdomain: string;

    @Column({ default: 'ACTIVE' }) // ACTIVE, INACTIVE, SUSPENDED, DELETED
    status: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    stripeCustomerId: string;

    @Column({ default: 'FREE' })
    subscriptionPlan: string;

    @Column({ type: 'timestamp', nullable: true })
    subscriptionExpiry: Date;

    @Column({ default: 1 })
    maxDevices: number;

    @Column({ default: 3 })
    maxBranches: number;

    @Column({ default: 10 })
    maxUsers: number;

    @Column({ default: 20 })
    maxTables: number;

    @Column({ type: 'jsonb', nullable: true })
    features: any;

    @Column({ nullable: true })
    stripeSubscriptionId: string;

    @OneToMany(() => Subscription, (subscription) => subscription.tenant)
    subscriptions: Subscription[];

    @Column({ default: 'PENDING' }) // PENDING, IN_PROGRESS, COMPLETED, FAILED
    provisioningStatus: string;

    @Column({ type: 'text', nullable: true })
    errorLog: string;

    @OneToOne(() => TenantSetting, (setting) => setting.tenant, { cascade: true })
    settings: TenantSetting;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
