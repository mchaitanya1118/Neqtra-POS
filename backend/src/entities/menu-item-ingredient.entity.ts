import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
} from 'typeorm';
import { MenuItem } from './menu-item.entity';
import { InventoryItem } from '../inventory/entities/inventory.entity';

@Entity('menu_item_ingredients')
export class MenuItemIngredient {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => MenuItem, { onDelete: 'CASCADE' })
    menuItem: MenuItem;

    @ManyToOne(() => InventoryItem, { onDelete: 'CASCADE' })
    inventoryItem: InventoryItem;

    @Column('float')
    quantity: number; // Quantity of inventory item used for 1 unit of menu item

    @Column({ nullable: true })
    note: string;
}
