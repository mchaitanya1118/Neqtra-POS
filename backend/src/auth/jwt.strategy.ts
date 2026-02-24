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

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private readonly redis: Redis;

    constructor(
        private configService: ConfigService,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private redisService: RedisService,
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
            throw new UnauthorizedException('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');
        const isBlacklisted = await this.redis.get(`blacklist:${token}`);
        if (isBlacklisted) {
            throw new UnauthorizedException('Session expired');
        }

        const { sub: userId, tenantId } = payload;
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['roleRel', 'tenant', 'branch']
        });

        if (!user) {
            throw new UnauthorizedException();
        }

        // Enforce tenant isolation if tenantId is present in token
        if (tenantId && user.tenant?.id !== tenantId) {
            throw new UnauthorizedException('Tenant mismatch');
        }

        return user;
    }
}
