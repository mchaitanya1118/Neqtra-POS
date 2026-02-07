import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  customerName: string;

  @Column({ nullable: true })
  contact: string;

  @Column()
  date: Date; // Full ISO timestamp

  @Column()
  guests: number;

  @Column({ default: 'PENDING' })
  status: string; // PENDING, CONFIRMED, CANCELLED

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
