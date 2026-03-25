import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('branches')
export class BranchesController {
    constructor(private readonly branchesService: BranchesService) { }

    @Get()
    async findAll() {
        return this.branchesService.findAll();
    }

    @Post()
    async create(@Body() createData: any) {
        return this.branchesService.create(createData);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.branchesService.remove(id);
    }
}
