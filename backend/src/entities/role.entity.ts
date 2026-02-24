import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';

@Entity('roles')
export class Role {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column('simple-array') // Storing permissions as comma-separated strings or JSON depending on DB, simple-array works for simple lists in Postgres/MySQL usually, or 'json'
    permissions: string[];

    @Column({ default: false })
    isSystem: boolean; // To prevent deleting core roles like Admin

    @ManyToOne(() => Tenant, { nullable: true, onDelete: 'CASCADE' })
    tenant: Tenant;

    @OneToMany(() => User, (user) => user.roleRel)
    users: User[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
