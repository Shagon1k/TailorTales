import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import type { Template, User } from '../../generated/prisma/client.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { CreateTemplateDto } from './dto/create-template.dto.js';
import { UpdateTemplateDto } from './dto/update-template.dto.js';
import { TemplatesService } from './templates.service.js';
import type { ITemplateDetail, ITemplateSummary } from './templates.types.js';

@Controller('templates')
export class TemplatesController {
    constructor(private readonly templatesService: TemplatesService) {}

    @Get()
    findAll(): Promise<ITemplateSummary[]> {
        return this.templatesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<ITemplateDetail> {
        return this.templatesService.findOne(id);
    }

    @Post()
    @UseGuards(AdminGuard)
    create(@CurrentUser() user: User, @Body() dto: CreateTemplateDto): Promise<Template> {
        return this.templatesService.create(dto, user.id);
    }

    @Patch(':id')
    @UseGuards(AdminGuard)
    update(@Param('id') id: string, @Body() dto: UpdateTemplateDto): Promise<ITemplateDetail> {
        return this.templatesService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    @UseGuards(AdminGuard)
    remove(@Param('id') id: string): Promise<void> {
        return this.templatesService.remove(id);
    }
}
