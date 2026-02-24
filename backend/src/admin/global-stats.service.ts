import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class GlobalStatsService {
    constructor(
        @InjectRepository(Tenant)
        private tenantRepo: Repository<Tenant>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ) { }

    async getCoreStats() {
        const totalTenants = await this.tenantRepo.count();
        const activeTenants = await this.tenantRepo.count({ where: { status: 'ACTIVE' } });
        const totalUsers = await this.userRepo.count();

        // In a real scenario, we'd sum up revenue across all tenant databases.
        // For now, we'll return aggregate counts from the master DB.
        const planDistribution = await this.tenantRepo
            .createQueryBuilder('tenant')
            .select('tenant.subscriptionPlan', 'plan')
            .addSelect('COUNT(*)', 'count')
            .groupBy('tenant.subscriptionPlan')
            .getRawMany();

        return {
            totalTenants,
            activeTenants,
            totalUsers,
            planDistribution,
        };
    }
}
