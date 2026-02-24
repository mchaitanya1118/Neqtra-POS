import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SuperAdminAuditLog } from './entities/audit-log.entity';

@Injectable()
export class AdminAuditService {
    constructor(
        @InjectRepository(SuperAdminAuditLog)
        private auditRepo: Repository<SuperAdminAuditLog>
    ) { }

    async log(action: string, admin: any, targetTenantId?: string, details?: any) {
        const log = this.auditRepo.create({
            action,
            admin,
            targetTenantId,
            details,
        });
        return await this.auditRepo.save(log);
    }

    async getLogs(limit: number = 100) {
        return await this.auditRepo.find({
            relations: ['admin'],
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
}
