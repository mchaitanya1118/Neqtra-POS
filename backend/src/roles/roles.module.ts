import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TenantOrmModule } from '../tenancy/tenant-orm.module';

import { Role } from '../entities/role.entity';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';

@Module({
    imports: [PassportModule, TenantOrmModule.forFeature([Role])],

    controllers: [RolesController],
    providers: [RolesService],
    exports: [RolesService],
})
export class RolesModule { }
