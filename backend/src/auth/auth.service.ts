import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  // Hardcoded for demo purposes as per current requirements
  // In a real app, this would query the database
  private readonly validPasscodes = {
    '1234': { id: 1, name: 'Demo User', role: 'Admin' },
    '0000': { id: 2, name: 'Staff', role: 'Waiter' },
  };

  private readonly validUsers = {
    admin: { password: 'password', id: 1, name: 'Admin User', role: 'Admin' },
  };

  async login(loginDto: LoginDto) {
    if (loginDto.passcode) {
      const user = this.validPasscodes[loginDto.passcode];
      if (user) return this.success(user);
    }

    if (loginDto.username && loginDto.password) {
      const user = this.validUsers[loginDto.username];
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
