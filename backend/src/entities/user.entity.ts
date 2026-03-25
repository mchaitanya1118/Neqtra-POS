import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Role } from './role.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Tenant } from '../tenants/entities/tenant.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    tenantId: string;

    @Column()
    name: string;

    @Column({ unique: true, nullable: true })
    username: string;

    @Column({ nullable: true })
    password: string;

    @Column({ unique: true, nullable: true })
    passcode: string;

    @Column({ nullable: true })
    role: string;

    // Transient property populated in services
    roleRel?: Role;

    // @ManyToOne(() => Branch, (branch) => branch.users, { nullable: true })
    // branch: Branch;

    @Column({ nullable: true })
    branchId: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    hourlyRate: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    fixedSalary: number;

    @Column({ nullable: true })
    shift: string;

    @Column({ nullable: true, select: false })
    refreshToken: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
