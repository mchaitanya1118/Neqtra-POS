import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Salary } from '../entities/salary.entity';
import { CreateSalaryDto } from './dto/create-salary.dto';

@Injectable()
export class SalariesService {
  constructor(
    @InjectRepository(Salary)
    private readonly salariesRepository: Repository<Salary>,
  ) {}

  create(createSalaryDto: CreateSalaryDto) {
    const salary = this.salariesRepository.create(createSalaryDto);
    return this.salariesRepository.save(salary);
  }

  findAll() {
    return this.salariesRepository.find({
      relations: ['user'],
      order: { paymentDate: 'DESC' }
    });
  }

  findOne(id: number) {
    return this.salariesRepository.findOne({
      where: { id },
      relations: ['user']
    });
  }

  async remove(id: number) {
    const salary = await this.findOne(id);
    if (!salary) throw new NotFoundException('Salary record not found');
    return this.salariesRepository.remove(salary);
  }
}
