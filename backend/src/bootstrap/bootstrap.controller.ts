import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BootstrapService } from './bootstrap.service';

@Controller('pos/bootstrap')
export class BootstrapController {
    constructor(private readonly bootstrapService: BootstrapService) { }

    @UseGuards(JwtAuthGuard)
    @Get()
    async getBootstrapData(@Request() req: any) {
        return this.bootstrapService.getBootstrapData();
    }
}
