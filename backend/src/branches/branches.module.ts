import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TenantOrmModule } from '../tenancy/tenant-orm.module';
import { Branch } from './entities/branch.entity';
import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
    imports: [
        PassportModule,
        TenantOrmModule.forFeature([Branch]),
        forwardRef(() => TenantsModule)
    ],
    controllers: [BranchesController],
    providers: [BranchesService],
    exports: [BranchesService],
})
export class BranchesModule { }
