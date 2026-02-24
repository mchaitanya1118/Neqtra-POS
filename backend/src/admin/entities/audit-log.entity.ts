import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../entities/user.entity';

@Entity('super_admin_audit_logs')
export class SuperAdminAuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    action: string; // e.g., 'UPDATE_TENANT_PLAN', 'DEACTIVATE_TENANT'

    @Column({ type: 'jsonb', nullable: true })
    details: any;

    @Column({ nullable: true })
    targetTenantId: string;

    @ManyToOne(() => User)
    admin: User;

    @CreateDateColumn()
    createdAt: Date;
}
