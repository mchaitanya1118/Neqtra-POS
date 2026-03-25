import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity('tenant_settings')
export class TenantSetting {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Tenant, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;

    @Column()
    tenantId: string;

    @Column({ default: 'USD' })
    currency: string;

    @Column({
        type: 'jsonb', default: {
            timezone: 'UTC',
            dateFormat: 'YYYY-MM-DD',
            timeFormat: 'HH:mm',
            language: 'en'
        }
    })
    localization: any;

    @Column({
        type: 'jsonb', default: {
            inventoryAlerts: true,
            emailNotifications: true,
            smsNotifications: false
        }
    })
    notifications: any;

    @Column({
        type: 'jsonb', default: {
            enableKOT: true,
            enableTableManagement: true,
            enableDelivery: true
        }
    })
    posFeatures: any;

    @Column({ type: 'text', nullable: true })
    logoUrl: string;

    @Column({ type: 'jsonb', nullable: true })
    customTheme: any;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
