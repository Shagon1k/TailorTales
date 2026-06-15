import {
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    HttpCode,
    Param,
    ParseIntPipe,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { ADMIN_STORIES_LIST_DEFAULT_PAGE_SIZE } from './stories.constants.js';
import { StoriesService } from './stories.service.js';
import type { IAdminStoryList } from './stories.types.js';

/**
 * Story moderation. Visibility toggling lives on `PATCH stories/:id/public` (also AdminGuard);
 * this controller adds the cross-user list and force-delete.
 */
@Controller('admin/stories')
@UseGuards(AdminGuard)
export class AdminStoriesController {
    constructor(private readonly storiesService: StoriesService) {}

    @Get()
    list(
        @Query('search') search: string | undefined,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('pageSize', new DefaultValuePipe(ADMIN_STORIES_LIST_DEFAULT_PAGE_SIZE), ParseIntPipe)
        pageSize: number,
    ): Promise<IAdminStoryList> {
        return this.storiesService.findAllForAdmin(search, page, pageSize);
    }

    @Delete(':id')
    @HttpCode(204)
    remove(@Param('id') id: string): Promise<void> {
        return this.storiesService.removeAsAdmin(id);
    }
}
