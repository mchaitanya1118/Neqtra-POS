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
    // SuperAdmin users have no tenant — skip device registration
    if (!tenantId) return null;

    // 1a. Check globally by identifier first (identifier is globally unique)
    //     If the same browser/device was already registered for any tenant,
    //     just update its lastActive instead of trying a duplicate insert.
    const globalDevice = await this.deviceRepo.findOne({
      where: { identifier: createDeviceDto.identifier },
    });

    if (globalDevice) {
      if (globalDevice.status === 'REVOKED') {
        throw new ForbiddenException('This device access has been revoked.');
      }
      globalDevice.lastActive = new Date();
      return await this.deviceRepo.save(globalDevice);
    }

    // 1b. Also check within this tenant (belt-and-suspenders)
    const existingDevice = await this.deviceRepo.findOne({
      where: { identifier: createDeviceDto.identifier, tenantId },
    });

    if (existingDevice) {
      existingDevice.lastActive = new Date();
      return await this.deviceRepo.save(existingDevice);
    }

    // 2. It's a new device, check limits
    const tenant = await this.tenantsService.findOne(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    const activeDevicesCount = await this.deviceRepo.count({
      where: { tenantId, status: 'ACTIVE' },
    });

    const maxDevices = tenant.maxDevices || 1;

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
