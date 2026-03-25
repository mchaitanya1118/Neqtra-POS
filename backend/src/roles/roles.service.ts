import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
    constructor(
        @InjectRepository(Role)
        private rolesRepository: Repository<Role>,
    ) { }

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
            }
        ];

        for (const roleData of defaultRoles) {
            const existing = await this.rolesRepository.findOne({ where: { name: roleData.name } });
            if (!existing) {
                const role = this.rolesRepository.create(roleData);
                await this.rolesRepository.save(role);
            }
        }
    }

    create(createRoleDto: CreateRoleDto) {
        const role = this.rolesRepository.create(createRoleDto);
        return this.rolesRepository.save(role);
    }

    findAll() {
        return this.rolesRepository.find();
    }

    async findOne(id: number) {
        return this.rolesRepository.findOne({ where: { id } });
    }

    async findByName(name: string) {
        return this.rolesRepository.findOne({ where: { name } });
    }

    async update(id: number, updateRoleDto: UpdateRoleDto) {
        const role = await this.findOne(id);
        if (!role) throw new Error('Role not found');
        if (role.isSystem) throw new Error('Cannot edit a system role');

        await this.rolesRepository.update(id, updateRoleDto);
        return this.findOne(id);
    }

    async remove(id: number) {
        const role = await this.findOne(id);
        if (!role) throw new Error('Role not found');
        if (role.isSystem) throw new Error('Cannot delete a system role');

        return this.rolesRepository.delete(id);
    }
}
