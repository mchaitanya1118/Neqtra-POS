import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('plans')
export class Plan {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string; // Starter, Pro, Enterprise

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @Column({ default: 'USD' })
    currency: string;

    @Column({ default: 'MONTHLY' }) // MONTHLY, YEARLY
    billingCycle: string;

    @Column({ type: 'jsonb', default: {} })
    quotas: {
        maxUsers: number;
        maxBranches: number;
        maxTables: number;
        maxDevices: number;
    };

    @Column({ type: 'jsonb', default: {} })
    features: {
        inventory: boolean;
        analytics: boolean;
        advancedReports: boolean;
        multiBranch: boolean;
        aiMenuExtraction: boolean;
    };

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
