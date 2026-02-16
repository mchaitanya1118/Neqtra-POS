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
        console.log('UsersService.create called with:', createUserDto);
        const { password, roleId, ...userData } = createUserDto;

        // Find Role if roleId is provided
        let roleRel: Role | null = null;
        if (roleId) {
            console.log('Finding role with ID:', roleId);
            roleRel = await this.usersRepository.manager.getRepository(Role).findOne({ where: { id: roleId } });
            console.log('Found Role:', roleRel);
        }

        const user = this.usersRepository.create({
            ...userData,
        });

        if (roleRel) {
            user.roleRel = roleRel;
        }

        if (password) {
            const salt = await bcrypt.genSalt();
            user.password = await bcrypt.hash(password, salt);
        }

        console.log('Saving user:', user);

        return this.usersRepository.save(user);
    }

    findAll() {
        return this.usersRepository.find({ relations: ['roleRel'] }); // Load relation
    }

    findOne(id: number) {
        return this.usersRepository.findOne({ where: { id }, relations: ['roleRel'] });
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
                user.roleRel = roleRel;
                user.role = roleRel.name;
            }
        }

        Object.assign(user, userData);

        if (password) {
            const salt = await bcrypt.genSalt();
            user.password = await bcrypt.hash(password, salt);
        }

        return this.usersRepository.save(user);
    }

    async remove(id: number) {
        await this.usersRepository.delete(id);
    }
}
