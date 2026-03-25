import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SalariesService } from './salaries.service';

import { SalariesController } from './salaries.controller';
import { TenantOrmModule } from '../tenancy/tenant-orm.module';
import { Salary } from '../entities/salary.entity';

@Module({
  imports: [PassportModule, TenantOrmModule.forFeature([Salary])],

  controllers: [SalariesController],
  providers: [SalariesService],
})
export class SalariesModule {}
