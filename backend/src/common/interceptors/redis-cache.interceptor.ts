import { CallHandler, ExecutionContext, Injectable, NestInterceptor, SetMetadata } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { ClsService } from 'nestjs-cls';

export const CACHE_TTL_METADATA = 'CACHE_TTL';
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_METADATA, ttl);

@Injectable()
export class RedisCacheInterceptor implements NestInterceptor {
    constructor(
        private readonly redisService: RedisService,
        private readonly cls: ClsService,
    ) { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();

        // Only cache GET requests
        if (request.method !== 'GET') {
            return next.handle();
        }

        const tenantId = this.cls.get('tenantId') || 'global';
        const originalUrl = request.originalUrl;

        // Tenant-isolated cache key to prevent data bleeding
        const cacheKey = `cache:${tenantId}:${originalUrl}`;

        let redisClient;
        try {
            redisClient = this.redisService.getOrThrow();
        } catch (e) {
            // Redis not configured or available, bypass cache
            return next.handle();
        }

        try {
            const cachedResponse = await redisClient.get(cacheKey);
            if (cachedResponse) {
                return of(JSON.parse(cachedResponse));
            }
        } catch (err) {
            // Silently fail cache reads so the app stays up
            console.warn('Redis cache read failed', err);
        }

        const handler = context.getHandler();
        // Default TTL is 60 seconds if not specified
        const ttl = Reflect.getMetadata(CACHE_TTL_METADATA, handler) || 60;

        return next.handle().pipe(
            tap((response) => {
                try {
                    if (response !== undefined && response !== null && redisClient) {
                        redisClient.set(cacheKey, JSON.stringify(response), 'EX', ttl);
                    }
                } catch (err) {
                    console.warn('Redis cache write failed', err);
                }
            }),
        );
    }
}
