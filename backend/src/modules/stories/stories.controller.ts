import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    MessageEvent,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Res,
    Sse,
    UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import type { Rating, Story, User } from '../../generated/prisma/client.js';
import type { Observable } from 'rxjs';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { GenerationService } from '../generation/generation.service.js';
import { RatingsService } from '../ratings/ratings.service.js';
import { CreateRatingDto } from '../ratings/dto/create-rating.dto.js';
import { RegenerationService } from '../regeneration/regeneration.service.js';
import { RegeneratePageDto } from '../regeneration/dto/regenerate-page.dto.js';
import { CreateStoryDto } from './dto/create-story.dto.js';
import { UpdateVisibilityDto } from './dto/update-visibility.dto.js';
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
    constructor(
        private readonly storiesService: StoriesService,
        private readonly generationService: GenerationService,
        private readonly regenerationService: RegenerationService,
        private readonly ratingsService: RatingsService,
    ) {}

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

    /** Returns the current user's active generation job, or null if none. */
    @Get('active-job')
    getActiveJob(@CurrentUser() user: User): Promise<{ jobId: string; storyId: string } | null> {
        return this.generationService.getActiveJob(user.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: User): Promise<IStoryDetail> {
        return this.storiesService.findOneByUser(id, user.id);
    }

    /** SSE stream: stage transitions + per-page image completion events. */
    @Sse(':id/progress')
    streamProgress(@Param('id') id: string, @CurrentUser() user: User): Observable<MessageEvent> {
        return this.generationService.streamProgress(id, user.id);
    }

    @Post()
    create(@CurrentUser() user: User, @Body() dto: CreateStoryDto): Promise<Story> {
        return this.storiesService.create(user.id, dto);
    }

    @Post(':id/generate')
    @HttpCode(202)
    generate(
        @Param('id') id: string,
        @CurrentUser() user: User,
    ): Promise<{ jobId: string; storyId: string }> {
        return this.generationService.enqueue(id, user.id);
    }

    /** Returns the rendered HTML for a single page — used by the iframe-based page preview. */
    @Get(':id/pages/:order/html')
    async getPageHtml(
        @Param('id') storyId: string,
        @Param('order', ParseIntPipe) pageOrder: number,
        @CurrentUser() user: User,
        @Res() res: Response,
    ): Promise<void> {
        const html = await this.storiesService.getPageHtml(storyId, pageOrder, user.id);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    }

    @Post(':id/pages/:order/regenerate')
    @HttpCode(200)
    regeneratePage(
        @Param('id') storyId: string,
        @Param('order', ParseIntPipe) pageOrder: number,
        @CurrentUser() user: User,
        @Body() dto: RegeneratePageDto,
    ): Promise<void> {
        return this.regenerationService.regeneratePage(storyId, pageOrder, user.id, dto);
    }

    /** Upsert the user's rating for their own completed story (one per user per story). */
    @Post(':id/rating')
    @HttpCode(200)
    rate(
        @Param('id') id: string,
        @CurrentUser() user: User,
        @Body() dto: CreateRatingDto,
    ): Promise<Rating> {
        return this.ratingsService.upsert(id, user.id, dto);
    }

    /** Admin-only override of a story's public visibility (override or retract). */
    @Patch(':id/public')
    @UseGuards(AdminGuard)
    @HttpCode(204)
    async setVisibility(@Param('id') id: string, @Body() dto: UpdateVisibilityDto): Promise<void> {
        await this.storiesService.setPublicVisibility(id, dto.isPublic);
    }

    @Delete(':id')
    @HttpCode(204)
    remove(@Param('id') id: string, @CurrentUser() user: User): Promise<void> {
        return this.storiesService.remove(id, user.id);
    }
}
