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

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  price: number; // Cost per unit

  @Column({ nullable: true })
  supplier: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
