import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { StoryType } from '../../../generated/prisma/client.js';
import {
    STORY_BLUEPRINT_DESCRIPTION_MAX_LENGTH,
    STORY_BLUEPRINT_NAME_MAX_LENGTH,
    STORY_BLUEPRINT_SYSTEM_PROMPT_MAX_LENGTH,
} from '../story-blueprints.constants.js';

export class UpdateStoryBlueprintDto {
    @IsString()
    @MinLength(1)
    @MaxLength(STORY_BLUEPRINT_NAME_MAX_LENGTH)
    @IsOptional()
    name?: string;

    @IsString()
    @MinLength(1)
    @MaxLength(STORY_BLUEPRINT_DESCRIPTION_MAX_LENGTH)
    @IsOptional()
    description?: string;

    @IsEnum(StoryType)
    @IsOptional()
    type?: StoryType;

    @IsString()
    @MinLength(1)
    @MaxLength(STORY_BLUEPRINT_SYSTEM_PROMPT_MAX_LENGTH)
    @IsOptional()
    systemPrompt?: string;
}
