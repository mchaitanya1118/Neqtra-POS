import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../entities/user.entity';

@Entity('branches')
export class Branch {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ unique: true, nullable: true })
    licenseKey: string;

    @ManyToOne(() => Tenant, (tenant) => tenant.branches, { onDelete: 'CASCADE' })
    tenant: Tenant;

    @OneToMany(() => User, (user) => user.branch)
    users: User[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
