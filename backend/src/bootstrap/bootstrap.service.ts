import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { Table } from '../entities/table.entity';
import { ClsService } from 'nestjs-cls';
import { RedisService } from '@liaoliaots/nestjs-redis';

@Injectable()
export class BootstrapService {
    private readonly logger = new Logger(BootstrapService.name);

    constructor(
        @InjectRepository(Category)
        private categoryRepo: Repository<Category>,
        @InjectRepository(MenuItem)
        private menuItemRepo: Repository<MenuItem>,
        @InjectRepository(Table)
        private tableRepo: Repository<Table>,
        private readonly cls: ClsService,
        private readonly redisService: RedisService,
    ) { }

    async getBootstrapData() {
        const tenantId = this.cls.get('tenantId');
        if (!tenantId) {
            throw new Error('Tenant ID not found in context.');
        }

        const cacheKey = `bootstrap:tenant:${tenantId}`;
        let redis;
        try {
            redis = this.redisService.getOrThrow();
            const cached = await redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (e) {
            this.logger.warn(`Redis get failed for bootstrap cache: ${e.message}`);
        }

        const [categories, tables] = await Promise.all([
            this.categoryRepo.find({
                relations: ['items', 'items.upsellItems'],
            }),
            this.tableRepo.find({ order: { id: 'ASC' } }),
        ]);

        const result = {
            categories,
            tables,
        };

        try {
            if (redis) {
                // Setup payload caching for 24 hours
                await redis.set(cacheKey, JSON.stringify(result), 'EX', 86400);
            }
        } catch (e) {
            this.logger.warn(`Redis set failed for bootstrap cache: ${e.message}`);
        }

        return result;
    }
}
