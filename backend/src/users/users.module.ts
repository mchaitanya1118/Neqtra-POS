import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PassportModule } from '@nestjs/passport';
import { TenantOrmModule } from '../tenancy/tenant-orm.module';

import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { Branch } from '../branches/entities/branch.entity';
import { RolesModule } from '../roles/roles.module';

@Module({
    imports: [
        PassportModule,
        TenantOrmModule.forFeature([User, Role, Branch]),
        RolesModule
    ],

    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule { }
