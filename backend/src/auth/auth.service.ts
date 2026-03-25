import { Injectable, UnauthorizedException, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { RolesService } from '../roles/roles.service';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Branch } from '../branches/entities/branch.entity';
import { TenantsService } from '../tenants/tenants.service';
import { BranchesService } from '../branches/branches.service';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { ProvisioningService } from '../tenants/provisioning.service';
import { ClsService } from 'nestjs-cls';

export interface SignupDto {
  name: string;
  email: string; // Treated as username
  password: string;
  businessName: string;
  businessType: string;
  subscriptionPlan?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly redis: Redis;

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
    @InjectRepository(Branch)
    private branchesRepository: Repository<Branch>,
    private rolesService: RolesService,
    private jwtService: JwtService,
    private tenantsService: TenantsService,
    private branchesService: BranchesService,
    private redisService: RedisService,
    private provisioningService: ProvisioningService,
    private readonly cls: ClsService,
  ) {
    this.redis = this.redisService.getOrThrow();
  }


  async signup(signupDto: SignupDto) {
    const { name, email, password, businessName, businessType } = signupDto;

    // 1. Check if user already exists
    const existingUser = await this.usersRepository.findOne({ where: { username: email } });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // 2. Generate unique subdomain (max 20 chars, alphanumeric)
    const baseSubdomain = businessName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
    let subdomain = baseSubdomain || 'tenant';
    let counter = 1;

    // Ensure subdomain is unique
    while (await this.tenantsRepository.findOne({ where: { subdomain } })) {
      const suffix = String(counter);
      subdomain = `${baseSubdomain.substring(0, 20 - suffix.length)}${suffix}`;
      counter++;
    }

    // 3. Create Tenant in Master DB (Sets status to PENDING)
    const tenant = await this.tenantsService.create({
      name: businessName,
      subdomain,
      status: 'ACTIVE',
    });

    // 4. Assign Subscription Plan
    await this.tenantsService.assignPlan(tenant.id, signupDto.subscriptionPlan || 'FREE');

    // 5. Provision Tenant Database (IN_PROGRESS -> COMPLETED)
    await this.provisioningService.provisionTenant(tenant.id, {
      name,
      email,
      password,
    });

    // 5. Generate Initial Token (Note: The user won't exist in master DB, so we return payload for first login)
    const tenantDataSource = await this.tenantsService.getTenantDataSource(tenant.id);
    const userRepository = tenantDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { username: email } });

    if (!user) {
      throw new InternalServerErrorException('Failed to retrieve provisioned user');
    }

    const payload = {
      username: user.username,
      sub: user.id,
      role: user.role || 'Admin',
      tenantId: tenant.id,
      branchId: user.branchId
    };

    return {
      success: true,
      tenant: tenant.subdomain,
      login_url: `https://${tenant.subdomain}.neqtra.com/login?tab=credentials`,
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role || 'Admin',
        tenantId: tenant.id,
        branchId: user.branchId,
      }
    };
  }

  async login(loginDto: LoginDto) {
    try {
      this.logger.log(`Login attempt for: ${loginDto.username || 'passcode'}`);
      let user: User | null = null;
      const tenantId = this.cls.get('tenantId');

      if (!tenantId && loginDto.username !== 'superadmin') {
        throw new BadRequestException('Tenant context missing. Please use your specific subdomain.');
      }

      if (loginDto?.passcode) {
        console.log('2a. Finding user by passcode');
        user = await this.usersRepository.findOne({
          where: { passcode: loginDto.passcode },
          relations: []
        });
      } else if (loginDto?.username && loginDto?.password) {
        console.log('2b. Finding user by username:', loginDto.username);
        user = await this.usersRepository.findOne({
          where: { username: loginDto.username },
          relations: []
        });

        if (user) {
          const isMatch = await bcrypt.compare(loginDto.password, user.password);
          if (!isMatch) {
            this.logger.warn(`Password mismatch for user: ${loginDto.username}`);
            user = null;
          }
        }
      }

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check Tenant Status from Master DB
      if (tenantId) {
        const tenant = await this.tenantsService.findOne(tenantId);
        if (!tenant) {
          throw new UnauthorizedException('Tenant not found');
        }

        if (tenant.status === 'SUSPENDED') {
          throw new UnauthorizedException('Tenant account is suspended. Please contact support.');
        }
      }

      const payload = {
        username: user.username,
        sub: user.id,
        role: user.role || 'Staff',
        tenantId: tenantId,
        branchId: user.branchId
      };

      // Fetch Role
      let roleRel: Role | null = null;
      if (user.role) {
         try {
           roleRel = await this.usersRepository.manager.getRepository(Role).findOne({ where: { name: user.role } });
         } catch(e) {
           this.logger.warn(`Could not fetch role permissions for role: ${user.role}`);
         }
      }

      const result = {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role || 'Staff',
          roleRel: roleRel,
          tenantId: tenantId,
          branchId: user.branchId
        },
      };
      return result;
    } catch (error) {
      this.logger.error(`Error during login for ${loginDto.username || 'passcode'}:`, error.stack);
      throw error;
    }
  }

  async logout(token: string) {
    try {
      const decoded = this.jwtService.decode(token) as any;
      if (decoded && decoded.exp) {
        const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
        if (expiresIn > 0) {
          // Add token to blacklist in Redis, expiring when the token itself expires
          await this.redis.set(`blacklist:${token}`, 'true', 'EX', expiresIn);
          this.logger.log(`Token blacklisted successfully for user ${decoded.username}`);
        }
      }
      return { success: true };
    } catch (error) {
      this.logger.error('Error blacklisting token during logout', error);
      throw new InternalServerErrorException('Failed to process logout');
    }
  }
}
