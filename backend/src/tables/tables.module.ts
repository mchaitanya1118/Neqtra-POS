import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantOrmModule } from '../tenancy/tenant-orm.module';
import { TablesService } from './tables.service';
import { TablesController } from './tables.controller';
import { Table } from '../entities/table.entity';

@Module({
  imports: [TenantOrmModule.forFeature([Table])],
  controllers: [TablesController],
  providers: [TablesService],
})
export class TablesModule { }
