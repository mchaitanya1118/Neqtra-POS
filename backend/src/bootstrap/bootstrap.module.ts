import { Module } from '@nestjs/common';
import { BootstrapController } from './bootstrap.controller';
import { BootstrapService } from './bootstrap.service';
import { TenantOrmModule } from '../tenancy/tenant-orm.module';
import { Category } from '../entities/category.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { Table } from '../entities/table.entity';

@Module({
    imports: [
        TenantOrmModule.forFeature([Category, MenuItem, Table])
    ],
    controllers: [BootstrapController],
    providers: [BootstrapService],
})
export class BootstrapModule { }
