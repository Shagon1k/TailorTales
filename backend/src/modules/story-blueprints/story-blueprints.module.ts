import { Module } from '@nestjs/common';
import { StoryBlueprintsController } from './story-blueprints.controller.js';
import { StoryBlueprintsService } from './story-blueprints.service.js';

@Module({
    controllers: [StoryBlueprintsController],
    providers: [StoryBlueprintsService],
})
export class StoryBlueprintsModule {}
