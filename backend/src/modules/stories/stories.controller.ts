import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import type { Story, User } from '../../generated/prisma/client.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { CreateStoryDto } from './dto/create-story.dto.js';
import {
    ALLOWED_PAGE_COUNTS,
    QUESTION_SUGGESTIONS,
    STORY_QUESTION_MAX_LENGTH,
    STORY_QUESTION_MIN_LENGTH,
} from './stories.constants.js';
import { StoriesService } from './stories.service.js';
import type { IStoryConfig, IStoryDetail, IStorySummary } from './stories.types.js';

@Controller('stories')
export class StoriesController {
    constructor(private readonly storiesService: StoriesService) {}

    // Static routes must be declared before :id to avoid being matched as an id param.
    @Get('public')
    @Public()
    findPublic(): Promise<IStorySummary[]> {
        return this.storiesService.findPublic();
    }

    @Get('config')
    getConfig(): IStoryConfig {
        return {
            allowedPageCounts: ALLOWED_PAGE_COUNTS,
            questionMinLength: STORY_QUESTION_MIN_LENGTH,
            questionMaxLength: STORY_QUESTION_MAX_LENGTH,
            questionSuggestions: QUESTION_SUGGESTIONS,
        };
    }

    @Get()
    findAll(@CurrentUser() user: User): Promise<IStorySummary[]> {
        return this.storiesService.findAllByUser(user.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: User): Promise<IStoryDetail> {
        return this.storiesService.findOneByUser(id, user.id);
    }

    @Post()
    create(@CurrentUser() user: User, @Body() dto: CreateStoryDto): Promise<Story> {
        return this.storiesService.create(user.id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    remove(@Param('id') id: string, @CurrentUser() user: User): Promise<void> {
        return this.storiesService.remove(id, user.id);
    }
}
