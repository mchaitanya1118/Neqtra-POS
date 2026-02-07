import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { MenuItem } from './menu-item.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  icon: string; // Storing icon name for frontend mapping

  @Column()
  variant: string; // 'mint', 'pink', etc.

  @OneToMany(() => MenuItem, (item) => item.category, { cascade: true })
  items: MenuItem[];

  @DeleteDateColumn()
  deletedAt?: Date;
}
