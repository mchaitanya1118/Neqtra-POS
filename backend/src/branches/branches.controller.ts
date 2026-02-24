import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('branches')
export class BranchesController {
    constructor(private readonly branchesService: BranchesService) { }

    @Get()
    async findAll(@Request() req) {
        return this.branchesService.findAll(req.user.tenantId);
    }

    @Post()
    async create(@Request() req, @Body() createData: any) {
        return this.branchesService.create(req.user.tenantId, createData);
    }

    @Delete(':id')
    async remove(@Request() req, @Param('id') id: string) {
        return this.branchesService.remove(req.user.tenantId, id);
    }
}
