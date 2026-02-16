import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  DeleteDateColumn,
} from 'typeorm';
import { Category } from './category.entity';

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ default: true })
  isVegetarian: boolean;

  @Column({ default: false })
  isSpicy: boolean;

  @Column({ default: 0 })
  stock: number;

  @Column({ default: false })
  isStockManaged: boolean;

  @ManyToOne(() => Category, (category) => category.items, {
    onDelete: 'CASCADE',
  })
  category: Category;

  @ManyToMany(() => MenuItem)
  @JoinTable({
    name: 'menu_item_upsells',
    joinColumn: { name: 'menu_item_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'upsell_item_id', referencedColumnName: 'id' },
  })
  upsellItems: MenuItem[];

  @DeleteDateColumn()
  deletedAt?: Date;
}
