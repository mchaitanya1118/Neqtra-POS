import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, In } from 'typeorm';
import { Table } from '../entities/table.entity';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(Table)
    private tableRepo: Repository<Table>,
    private entityManager: EntityManager,
  ) { }

  async seed() {
    const count = await this.tableRepo.count();
    // if (count > 0) return { message: 'Already seeded' };

    const tables: Partial<Table>[] = [];
    for (let i = 1; i <= 6; i++) {
      tables.push({ label: `Table ${i}`, capacity: 4, status: 'FREE' });
    }
    await this.tableRepo.save(tables);
    return { message: 'Seeded 6 tables' };
  }

  create(createTableDto: CreateTableDto) {
    return this.tableRepo.save(createTableDto);
  }

  findAll() {
    return this.tableRepo.find({ order: { id: 'ASC' } });
  }

  findOne(id: number) {
    return this.tableRepo.findOneBy({ id });
  }

  update(id: number, updateTableDto: UpdateTableDto) {
    return this.tableRepo.update(id, updateTableDto);
  }

  remove(id: number) {
    return this.tableRepo.delete(id);
  }

  async shiftTable(fromId: number, toId: number) {
    return this.entityManager.transaction(async (manager) => {
      const fromTable = await manager.findOneBy(Table, { id: fromId });
      const toTable = await manager.findOneBy(Table, { id: toId });

      if (!fromTable || !toTable) throw new Error('Table not found');
      if (fromTable.status !== 'OCCUPIED')
        throw new Error('Source table must be occupied');
      if (toTable.status !== 'FREE')
        throw new Error('Target table must be free');

      // Update Tables
      fromTable.status = 'FREE';
      toTable.status = 'OCCUPIED';
      await manager.save([fromTable, toTable]);

      // Move active orders
      // In from typeorm is needed but we can also use individual updates or a single update with In if imported
      await manager.update(
        Order,
        {
          tableName: fromTable.label,
          status: In(['PENDING', 'CONFIRMED', 'PARTIAL', 'SERVED']),
        },
        { tableName: toTable.label },
      );

      return { from: fromTable, to: toTable };
    });
  }
}
