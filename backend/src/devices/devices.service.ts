import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './entities/device.entity';
import { CreateDeviceDto } from './dto/create-device.dto';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
    private readonly tenantsService: TenantsService,
  ) { }

  async registerDevice(tenantId: string, createDeviceDto: CreateDeviceDto) {
    // 1. Check if device is already registered (if so, just return it / update lastActive)
    const existingDevice = await this.deviceRepo.findOne({
      where: { identifier: createDeviceDto.identifier, tenantId },
    });

    if (existingDevice) {
      existingDevice.lastActive = new Date();
      if (existingDevice.status === 'REVOKED') {
        throw new ForbiddenException('This device access has been revoked.');
      }
      return await this.deviceRepo.save(existingDevice);
    }

    // 2. It's a new device, check limits
    const tenant = await this.tenantsService.findOne(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    const activeDevicesCount = await this.deviceRepo.count({
      where: { tenantId, status: 'ACTIVE' },
    });

    let maxDevices = Infinity;
    switch (tenant.subscriptionPlan.toUpperCase()) {
      case 'FREE':
        maxDevices = 1;
        break;
      case 'STARTER':
        maxDevices = 2;
        break;
      case 'PRO':
      case 'ENTERPRISE':
      case 'TRIAL':
      default:
        maxDevices = Infinity;
        break;
    }

    if (activeDevicesCount >= maxDevices) {
      throw new ForbiddenException(
        `Device limit reached. Your ${tenant.subscriptionPlan} plan only allows up to ${maxDevices} active devices.`
      );
    }

    // 3. Register and save
    const newDevice = this.deviceRepo.create({
      tenantId,
      branchId: createDeviceDto.branchId,
      name: createDeviceDto.name,
      identifier: createDeviceDto.identifier,
      lastActive: new Date(),
    });

    return await this.deviceRepo.save(newDevice);
  }

  async findAll(tenantId: string, branchId?: string) {
    const where: any = { tenantId };
    if (branchId) {
      where.branchId = branchId;
    }
    return await this.deviceRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async countActive(tenantId: string): Promise<number> {
    return this.deviceRepo.count({
      where: { tenantId, status: 'ACTIVE' },
    });
  }

  async revokeDevice(tenantId: string, id: string) {
    const device = await this.deviceRepo.findOne({ where: { id, tenantId } });
    if (!device) throw new NotFoundException('Device not found');

    device.status = 'REVOKED';
    return await this.deviceRepo.save(device);
  }
}
