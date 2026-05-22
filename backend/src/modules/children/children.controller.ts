import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { type Child, type User } from '../../generated/prisma/client.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { ChildrenService } from './children.service.js';
import { CreateChildDto } from './dto/create-child.dto.js';
import { UpdateChildDto } from './dto/update-child.dto.js';

@Controller('children')
export class ChildrenController {
    constructor(private readonly childrenService: ChildrenService) {}

    @Get()
    findAll(@CurrentUser() user: User): Promise<Child[]> {
        return this.childrenService.findAllByUser(user.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: User): Promise<Child> {
        return this.childrenService.findOne(id, user.id);
    }

    @Post()
    create(@CurrentUser() user: User, @Body() dto: CreateChildDto): Promise<Child> {
        return this.childrenService.create(user.id, dto);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @CurrentUser() user: User,
        @Body() dto: UpdateChildDto,
    ): Promise<Child> {
        return this.childrenService.update(id, user.id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    remove(@Param('id') id: string, @CurrentUser() user: User): Promise<void> {
        return this.childrenService.remove(id, user.id);
    }
}
