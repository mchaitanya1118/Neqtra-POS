import { Injectable, ForbiddenException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class BranchesService {
    constructor(
        @InjectRepository(Branch)
        private branchesRepository: Repository<Branch>,
        @Inject(forwardRef(() => TenantsService))
        private tenantsService: TenantsService
    ) { }

    async create(createBranchDto: Partial<Branch>): Promise<Branch> {
        // Quota check can still happen if we have the tenant context from the repo/connection
        // But for now, let's simplify and rely on master-level checks during branch creation if needed, 
        // or just allow it and enforce quotas in the UI/Provisioning.
        const branch = this.branchesRepository.create(createBranchDto);
        return this.branchesRepository.save(branch);
    }

    async findAll(): Promise<Branch[]> {
        return this.branchesRepository.find({
            order: { createdAt: 'DESC' }
        });
    }

    async countActive(tenantId?: string): Promise<number> {
        return this.branchesRepository.count();
    }

    async remove(branchId: string): Promise<void> {
        const branch = await this.branchesRepository.findOne({
            where: { id: branchId },
            relations: ['users']
        });
        if (!branch) throw new NotFoundException('Branch not found');

        await this.branchesRepository.remove(branch);
    }
}
