import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantOrmModule } from '../tenancy/tenant-orm.module';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryItem } from './entities/inventory.entity';
import { MenuItemIngredient } from '../entities/menu-item-ingredient.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TenantOrmModule.forFeature([InventoryItem, MenuItemIngredient]),
    NotificationsModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule { }
