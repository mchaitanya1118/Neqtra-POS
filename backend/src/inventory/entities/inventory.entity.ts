import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('inventory')
export class InventoryItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('float')
  quantity: number;

  @Column()
  unit: string; // kg, liters, pcs, etc.

  @Column('float', { default: 10 })
  threshold: number; // Low stock alert level

  @Column({ nullable: true })
  supplier: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
