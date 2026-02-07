import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tables')
export class Table {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  label: string;

  @Column({ default: 'FREE' })
  status: string; // FREE, OCCUPIED, RESERVED

  @Column({ default: 4 })
  capacity: number;
}
