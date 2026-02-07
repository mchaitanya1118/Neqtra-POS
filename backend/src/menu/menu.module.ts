import { Module } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../entities/category.entity';
import { MenuItem } from '../entities/menu-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category, MenuItem])],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}
