
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'dev_secret_key_123',
        });
    }

    async validate(payload: any) {
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
