import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async create(createUserDto: CreateUserDto) {
        const { password, roleId, ...userData } = createUserDto;

        // Find Role if roleId is provided
        let roleRel: Role | null = null;
        if (roleId) {
            roleRel = await this.usersRepository.manager.getRepository(Role).findOne({ where: { id: roleId } });
        }

        const user = this.usersRepository.create(userData);

        if (roleRel) {
            user.role = roleRel.name;
        }

        if (password) {
            const salt = await bcrypt.genSalt();
            user.password = await bcrypt.hash(password, salt);
        }

        const savedUser = await this.usersRepository.save(user);
        if (roleRel) {
            (savedUser as any).roleRel = roleRel;
        }
        return savedUser;
    }

    async findAll() {
        const users = await this.usersRepository.find();
        
        // Fetch and attach roles for all users
        const roleRepository = this.usersRepository.manager.getRepository(Role);
        const roles = await roleRepository.find();
        const roleMap = new Map(roles.map(r => [r.name, r]));
        
        return users.map(user => {
            if (user.role && roleMap.has(user.role)) {
                (user as any).roleRel = roleMap.get(user.role);
            }
            return user;
        });
    }

    async findOne(id: number) {
        const user = await this.usersRepository.findOne({
            where: { id }
        });
        
        if (user && user.role) {
            const roleRel = await this.usersRepository.manager.getRepository(Role).findOne({ where: { name: user.role } });
            if (roleRel) {
                (user as any).roleRel = roleRel;
            }
        }
        
        return user;
    }

    async update(id: number, updateUserDto: UpdateUserDto) {
        const user = await this.findOne(id);
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        const { password, roleId, ...userData } = updateUserDto;

        // Handle Role Update
        if (roleId) {
            const roleRel = await this.usersRepository.manager.getRepository(Role).findOne({ where: { id: roleId } });
            if (roleRel) {
                user.role = roleRel.name;
            }
        }

        Object.assign(user, userData);

        if (password) {
            const salt = await bcrypt.genSalt();
            user.password = await bcrypt.hash(password, salt);
        }

        const savedUser = await this.usersRepository.save(user);
        
        if (roleId) {
            const roleRel = await this.usersRepository.manager.getRepository(Role).findOne({ where: { id: roleId } });
            if (roleRel) {
                (savedUser as any).roleRel = roleRel;
            }
        } else if (savedUser.role) {
            const roleRel = await this.usersRepository.manager.getRepository(Role).findOne({ where: { name: savedUser.role } });
            if (roleRel) {
                (savedUser as any).roleRel = roleRel;
            }
        }
        
        return savedUser;
    }

    async remove(id: number) {
        const user = await this.findOne(id);
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        await this.usersRepository.delete(id);
    }
}
