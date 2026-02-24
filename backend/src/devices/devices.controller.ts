import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Query } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) { }

  @Post('register')
  register(@Request() req, @Body() createDeviceDto: CreateDeviceDto) {
    return this.devicesService.registerDevice(req.user.tenant?.id, createDeviceDto);
  }

  @Get()
  findAll(@Request() req, @Query('branchId') branchId?: string) {
    return this.devicesService.findAll(req.user.tenant?.id, branchId);
  }

  @Patch(':id/revoke')
  revoke(@Request() req, @Param('id') id: string) {
    return this.devicesService.revokeDevice(req.user.tenant?.id, id);
  }
}
