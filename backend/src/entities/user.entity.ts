import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Role } from './role.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Branch } from '../branches/entities/branch.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ unique: true, nullable: true })
    username: string;

    @Column({ nullable: true })
    password: string;

    @Column({ unique: true, nullable: true })
    passcode: string;

    @Column({ nullable: true })
    role: string; // Deprecated, use roleRel

    @ManyToOne(() => Role, (role) => role.users, { nullable: true, eager: true }) // Eager load role to get permissions
    roleRel: Role;

    @ManyToOne(() => Tenant, (tenant) => tenant.users, { nullable: true, onDelete: 'CASCADE' })
    tenant: Tenant;

    @ManyToOne(() => Branch, (branch) => branch.users, { nullable: true })
    branch: Branch;

    @Column({ nullable: true, select: false })
    refreshToken: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
