import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('salaries')
export class Salary {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    user: User;

    @Column()
    userId: number; // For easy fetching without relations

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ type: 'timestamp' })
    paymentDate: Date;

    @Column()
    paymentMonth: string; // e.g., "March 2026"

    @Column()
    paymentMethod: string; // e.g., "Cash", "Bank Transfer"

    @Column({ default: 'REGULAR' })
    type: string; // 'REGULAR' | 'ADVANCE'

    @Column({ nullable: true })
    referenceNote: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
