import { Injectable, UnauthorizedException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  async onModuleInit() {
    const count = await this.usersRepository.count();
    if (count === 0) {
      this.logger.log('No users found. Seeding default admin user...');
      const admin = this.usersRepository.create({
        name: 'Admin User',
        username: 'admin',
        password: 'password',
        passcode: '1234',
        role: 'Admin',
      });
      await this.usersRepository.save(admin);
      this.logger.log('Default admin user seeded. Username: admin, Passcode: 1234');
    }
  }

  async login(loginDto: LoginDto) {
    if (loginDto?.passcode) {
      const user = await this.usersRepository.findOne({ where: { passcode: loginDto.passcode } });
      console.log('Login by passcode:', loginDto.passcode, 'User found:', user);
      if (user) return this.success(user);
    }

    if (loginDto?.username && loginDto?.password) {
      const user = await this.usersRepository.findOne({ where: { username: loginDto.username } });
      console.log('Login by username:', loginDto.username, 'User found:', user);
      if (user && user.password === loginDto.password) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...safeUser } = user;
        return this.success(safeUser);
      }
    }

    throw new UnauthorizedException('Invalid credentials');
  }

  private success(user: any) {
    return {
      access_token: 'mock-jwt-token-' + Date.now(),
      user: user,
    };
  }
}
