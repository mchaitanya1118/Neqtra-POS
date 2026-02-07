import { Controller, Post, Body, HttpCode, HttpStatus, Logger, BadRequestException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    this.logger.log(`Login attempt with payload: ${JSON.stringify(loginDto)}`);

    if (!loginDto || (!loginDto.passcode && (!loginDto.username || !loginDto.password))) {
      this.logger.warn('Login failed: Missing credentials');
      throw new BadRequestException('Passcode or Username/Password is required');
    }

    try {
      const result = await this.authService.login(loginDto);
      if (!result) {
        throw new BadRequestException('Invalid credentials');
      }
      return result;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Login failed: ${error.message}`, error.stack);
      // TEMPORARY: Expose error message for debugging production issue
      throw new InternalServerErrorException(`Login error: ${error.message}`);
    }
  }
}
