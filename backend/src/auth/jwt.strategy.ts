import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { Request } from 'express';
import { TenancyService } from '../tenancy/tenancy.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private readonly redis: Redis;

    constructor(
        private configService: ConfigService,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private redisService: RedisService,
        private tenancyService: TenancyService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'dev_secret_key_123',
            passReqToCallback: true,
        });
        this.redis = this.redisService.getOrThrow();
    }

    async validate(request: Request, payload: any) {
        // Extract token to check against blacklist
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            console.error('[JwtStrategy] Validation failed: No Auth Header');
            throw new UnauthorizedException('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');

        try {
            if (this.redis) {
                const isBlacklisted = await this.redis.get(`blacklist:${token}`);
                if (isBlacklisted) {
                    console.error('[JwtStrategy] Validation failed: Session expired (blacklisted)');
                    throw new UnauthorizedException('Session expired');
                }
            }
        } catch (err: any) {
            if (err instanceof UnauthorizedException) throw err;
            // Ignore Redis connection errors so the app still functions without a cache server
            console.warn('[JwtStrategy] Redis blacklist check bypassed due to connection error:', err.message);
        }

        const { sub: userId, tenantId } = payload;
        
        // Fetch user from correct DB
        let userRepo = this.usersRepository;
        if (tenantId) {
            try {
                const tenantDataSource = await this.tenancyService.getTenantDataSource(tenantId);
                userRepo = tenantDataSource.getRepository(User);
            } catch (e) {
                console.error(`[JwtStrategy] Failed to get tenant DB for user ${userId}:`, e.message);
                throw new UnauthorizedException('Tenant database not available');
            }
        }

        const user = await userRepo.findOne({
            where: { id: userId },
            relations: []
        });

        if (!user) {
            console.error(`[JwtStrategy] Validation failed: User not found in database for ID ${userId}`);
            throw new UnauthorizedException();
        }

        // Enforce tenant isolation if tenantId is present in token
        if (tenantId && user.tenantId !== tenantId) {
            console.error(`[JwtStrategy] Validation failed: Tenant mismatch. Token tenantId: ${tenantId}, User tenantId: ${user.tenantId}`);
            throw new UnauthorizedException('Tenant mismatch');
        }

        return user;
    }
}
