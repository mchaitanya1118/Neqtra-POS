import { Module } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { AiMenuService } from './ai-menu.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantOrmModule } from '../tenancy/tenant-orm.module';
import { Category } from '../entities/category.entity';
import { MenuItem } from '../entities/menu-item.entity';

@Module({
  imports: [TenantOrmModule.forFeature([Category, MenuItem])],
  controllers: [MenuController],
  providers: [MenuService, AiMenuService],
})
export class MenuModule { }
