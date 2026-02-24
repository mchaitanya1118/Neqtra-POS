import { Injectable, UnauthorizedException, OnModuleInit, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { User } from '../entities/user.entity';
import { RolesService } from '../roles/roles.service';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Branch } from '../branches/entities/branch.entity';
import { TenantsService } from '../tenants/tenants.service';
import { BranchesService } from '../branches/branches.service';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';

export interface SignupDto {
  name: string;
  email: string; // Treated as username
  password: string;
  businessName: string;
  businessType: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
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
  ) {
    this.redis = this.redisService.getOrThrow();
  }

  async onModuleInit() {
    // Only seed if no tenants exist
    try {
      // Check for default tenant
      const existingTenant = await this.tenantsRepository.findOne({ where: { name: 'Default Tenant' } });
      let tenant = existingTenant;

      if (!tenant) {
        this.logger.log('No default tenant found. Seeding...');
        tenant = await this.tenantsService.create({
          name: 'Default Tenant',
          status: 'ACTIVE',
          subscriptionPlan: 'ENTERPRISE',
        });
        this.logger.log('Default Tenant Database provisioned successfully.');
        this.logger.log('Default Tenant seeded.');
      }

      // Check for default branch
      const existingBranch = await this.branchesRepository.findOne({ where: { name: 'Main Branch', tenant: { id: tenant.id } } });
      let branch = existingBranch;

      if (!branch) {
        this.logger.log('No default branch found. Seeding...');
        branch = this.branchesRepository.create({
          name: 'Main Branch',
          address: 'Default Address',
          tenant: tenant,
        });
        await this.branchesRepository.save(branch);
        this.logger.log('Default Branch seeded.');
      }

      const count = await this.usersRepository.count();
      if (count === 0) {
        this.logger.log('No users found. Seeding default admin user...');
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash('password', salt);

        const adminRole = await this.rolesService.findByName('Admin');

        const admin = this.usersRepository.create({
          name: 'Admin User',
          username: 'admin',
          password: hashedPassword,
          passcode: '1234',
          // role: 'Admin', // Deprecated
          roleRel: adminRole || undefined,
          tenant: tenant,
          branch: branch,
        });
        await this.usersRepository.save(admin);
        this.logger.log('Default admin user seeded. Username: admin, Passcode: 1234');
      }

      const superAdminRole = await this.rolesService.findByName('SuperAdmin');
      const existingSuperAdmin = await this.usersRepository.findOne({ where: { username: 'superadmin' } });

      if (!existingSuperAdmin && superAdminRole) {
        this.logger.log('No superadmin found. Seeding...');
        const salt = await bcrypt.genSalt();
        const pased = await bcrypt.hash('superadmin', salt);

        const sAdmin = this.usersRepository.create({
          name: 'System Admin',
          username: 'superadmin',
          password: pased,
          passcode: '0000',
          roleRel: superAdminRole,
          tenant: tenant,
          branch: branch,
        });
        await this.usersRepository.save(sAdmin);
        this.logger.log('Superadmin seeded. Username: superadmin, Passcode: 0000');
      }
    } catch (error) {
      this.logger.error(`Failed to seed database: ${error.message}`, error.stack);
    }
  }

  async signup(signupDto: SignupDto) {
    const { name, email, password, businessName, businessType } = signupDto;

    // 1. Check if user already exists
    const existingUser = await this.usersRepository.findOne({ where: { username: email } });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // 2. Create Tenant
    const tenant = await this.tenantsService.create({
      name: businessName,
      status: 'ACTIVE',
      subscriptionPlan: 'TRIAL',
      // industry: businessType // Add industry if needed in entity
    });

    // 3. Create Default Branch
    const branch = await this.branchesService.create(tenant.id, {
      name: 'Main Branch',
      address: 'Headquarters',
      tenant: tenant,
    });

    // 4. Create Admin User
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    const adminRole = await this.rolesService.findByName('Admin');

    const user = this.usersRepository.create({
      name,
      username: email,
      password: hashedPassword,
      roleRel: adminRole || undefined,
      tenant,
      branch,
    });

    await this.usersRepository.save(user);

    // 5. Generate Token
    const payload = {
      username: user.username,
      sub: user.id,
      role: user.roleRel?.name || 'Admin',
      tenantId: tenant.id,
      branchId: branch.id
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.roleRel?.name,
        tenantId: tenant.id,
        branchId: branch.id,
        subscriptionPlan: tenant.subscriptionPlan
      }
    };
  }

  async login(loginDto: LoginDto) {
    let user: User | null = null;

    if (loginDto?.passcode) {
      user = await this.usersRepository.findOne({
        where: { passcode: loginDto.passcode },
        relations: ['roleRel', 'tenant', 'branch']
      });
    } else if (loginDto?.username && loginDto?.password) {
      user = await this.usersRepository.findOne({
        where: { username: loginDto.username },
        relations: ['roleRel', 'tenant', 'branch']
      });

      if (user) {
        const isMatch = await bcrypt.compare(loginDto.password, user.password);
        if (!isMatch) user = null;
      }
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.username !== 'superadmin' && user.tenant) {
      if (user.tenant.status === 'SUSPENDED') {
        throw new UnauthorizedException('Tenant account is suspended. Please contact support.');
      }

      if (user.tenant.subscriptionExpiry && new Date(user.tenant.subscriptionExpiry) < new Date()) {
        throw new UnauthorizedException('Subscription Expired. Please renew to continue.');
      }
    }

    // Self-heal default admin account if local postgres wiped relations
    if (user.username === 'admin' && !user.tenant) {
      const defaultTenant = await this.tenantsRepository.findOne({ where: { name: 'Default Tenant' } });
      const defaultBranch = await this.branchesRepository.findOne({ where: { name: 'Main Branch' } });
      if (defaultTenant) {
        user.tenant = defaultTenant;
        if (defaultBranch) {
          user.branch = defaultBranch;
        }
        await this.usersRepository.save(user);
      }
    }

    const payload = {
      username: user.username,
      sub: user.id,
      role: user.roleRel?.name || 'Staff',
      tenantId: user.tenant?.id,
      branchId: user.branch?.id
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.roleRel?.name,
        tenantId: user.tenant?.id,
        branchId: user.branch?.id,
        subscriptionPlan: user.tenant?.subscriptionPlan
      },
      // Return refresh token if needed in future, currently just access token
    };
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
