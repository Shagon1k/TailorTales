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
import type { StoryBlueprint, User } from '../../generated/prisma/client.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { CreateStoryBlueprintDto } from './dto/create-story-blueprint.dto.js';
import { UpdateStoryBlueprintDto } from './dto/update-story-blueprint.dto.js';
import { StoryBlueprintsService } from './story-blueprints.service.js';
import type { IStoryBlueprintDetail, IStoryBlueprintSummary } from './story-blueprints.types.js';

@Controller('story-blueprints')
export class StoryBlueprintsController {
    constructor(private readonly storyBlueprintsService: StoryBlueprintsService) {}

    @Get()
    findAll(): Promise<IStoryBlueprintSummary[]> {
        return this.storyBlueprintsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<IStoryBlueprintDetail> {
        return this.storyBlueprintsService.findOne(id);
    }

    @Post()
    @UseGuards(AdminGuard)
    create(
        @CurrentUser() user: User,
        @Body() dto: CreateStoryBlueprintDto,
    ): Promise<StoryBlueprint> {
        return this.storyBlueprintsService.create(dto, user.id);
    }

    @Patch(':id')
    @UseGuards(AdminGuard)
    update(
        @Param('id') id: string,
        @Body() dto: UpdateStoryBlueprintDto,
    ): Promise<IStoryBlueprintDetail> {
        return this.storyBlueprintsService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    @UseGuards(AdminGuard)
    remove(@Param('id') id: string): Promise<void> {
        return this.storyBlueprintsService.remove(id);
    }
}
