import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class BranchesService {
    constructor(
        @InjectRepository(Branch)
        private branchesRepository: Repository<Branch>,
        private tenantsService: TenantsService
    ) { }

    async create(tenantId: string, createBranchDto: Partial<Branch>): Promise<Branch> {
        const tenant = await this.tenantsService.findOne(tenantId);
        if (!tenant) throw new NotFoundException('Tenant not found');

        const activeBranchesCount = await this.branchesRepository.count({
            where: { tenant: { id: tenantId } },
        });

        let maxBranches = 1;
        switch (tenant.subscriptionPlan?.toUpperCase()) {
            case 'FREE':
            case 'STARTER':
            case 'TRIAL':
                maxBranches = 1;
                break;
            case 'PRO':
                maxBranches = 3;
                break;
            case 'ENTERPRISE':
                maxBranches = Infinity;
                break;
        }

        if (activeBranchesCount >= maxBranches) {
            throw new ForbiddenException(
                `Workspace limit reached. Your ${tenant.subscriptionPlan} plan only allows up to ${maxBranches} active branch location(s).`
            );
        }

        const branch = this.branchesRepository.create({
            ...createBranchDto,
            tenant: { id: tenantId } as any
        });
        return this.branchesRepository.save(branch);
    }

    async findAll(tenantId: string): Promise<Branch[]> {
        return this.branchesRepository.find({
            where: { tenant: { id: tenantId } },
            order: { createdAt: 'DESC' }
        });
    }

    async countActive(tenantId: string): Promise<number> {
        return this.branchesRepository.count({
            where: { tenant: { id: tenantId } },
        });
    }

    async remove(tenantId: string, branchId: string): Promise<void> {
        const branch = await this.branchesRepository.findOne({
            where: { id: branchId, tenant: { id: tenantId } },
            relations: ['users']
        });
        if (!branch) throw new NotFoundException('Branch not found');

        // Note: Realistically, you'd check if it's the LAST branch or has active users.
        await this.branchesRepository.remove(branch);
    }
}
