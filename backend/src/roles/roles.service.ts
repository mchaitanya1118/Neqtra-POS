import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService implements OnModuleInit {
    constructor(
        @InjectRepository(Role)
        private rolesRepository: Repository<Role>,
    ) { }

    async onModuleInit() {
        await this.seedRoles();
    }

    async seedRoles() {
        const defaultRoles = [
            {
                name: 'SuperAdmin',
                permissions: ['Dashboard', 'Orders', 'Tables', 'Billing', 'Delivery', 'Inventory', 'Dues', 'Reports', 'Menu', 'Accounting', 'Users', 'Tenant'],
                isSystem: true,
            },
            {
                name: 'Admin',
                permissions: ['Dashboard', 'Orders', 'Tables', 'Billing', 'Delivery', 'Inventory', 'Dues', 'Reports', 'Menu', 'Accounting', 'Users'],
                isSystem: true,
            },
            {
                name: 'Manager',
                permissions: ['Dashboard', 'Orders', 'Tables', 'Billing', 'Inventory', 'Reports', 'Users'],
                isSystem: true,
            },
            {
                name: 'Cashier',
                permissions: ['Orders', 'Tables', 'Billing', 'Dues'],
                isSystem: true,
            },
            {
                name: 'Staff',
                permissions: ['Orders', 'Tables', 'Billing'],
                isSystem: true,
            },
            {
                name: 'Kitchen',
                permissions: ['Orders'],
                isSystem: true,
            },
        ];

        for (const roleData of defaultRoles) {
            const existing = await this.rolesRepository.findOne({ where: { name: roleData.name } });
            if (!existing) {
                console.log(`Seeding role: ${roleData.name}`);
                const role = this.rolesRepository.create(roleData);
                await this.rolesRepository.save(role);
            }
        }
    }

    create(tenantId: string, createRoleDto: CreateRoleDto) {
        const role = this.rolesRepository.create({
            ...createRoleDto,
            tenant: { id: tenantId } as any // associate role with the tenant
        });
        return this.rolesRepository.save(role);
    }

    findAll(tenantId: string) {
        return this.rolesRepository.find({
            where: [
                { isSystem: true }, // Global default roles
                { tenant: { id: tenantId } } // Tenant-specific custom roles
            ]
        });
    }

    async findOne(tenantId: string, id: number) {
        return this.rolesRepository.findOne({
            where: [
                { id, isSystem: true },
                { id, tenant: { id: tenantId } }
            ]
        });
    }

    async findByName(name: string) {
        return this.rolesRepository.findOne({ where: { name } });
    }

    async update(tenantId: string, id: number, updateRoleDto: UpdateRoleDto) {
        const role = await this.findOne(tenantId, id);
        if (!role) throw new Error('Role not found');
        if (role.isSystem) throw new Error('Cannot edit a system role');

        await this.rolesRepository.update({ id, tenant: { id: tenantId } }, updateRoleDto);
        return this.findOne(tenantId, id);
    }

    async remove(tenantId: string, id: number) {
        const role = await this.findOne(tenantId, id);
        if (!role) throw new Error('Role not found');
        if (role.isSystem) throw new Error('Cannot delete a system role');

        return this.rolesRepository.delete({ id, tenant: { id: tenantId } });
    }
}
