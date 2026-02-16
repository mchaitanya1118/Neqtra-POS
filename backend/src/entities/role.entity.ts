import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

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

    @OneToMany(() => User, (user) => user.roleRel)
    users: User[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
