import { IsEnum, IsIn, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Language, StoryType } from '../../../generated/prisma/client.js';
import {
    ALLOWED_PAGE_COUNTS,
    STORY_QUESTION_MAX_LENGTH,
    STORY_QUESTION_MIN_LENGTH,
} from '../stories.constants.js';

export class CreateStoryDto {
    @IsString()
    childId!: string;

    /** Optional protagonist. Omit for a child-led story (no recurring character). */
    @IsString()
    @IsOptional()
    characterId?: string;

    @IsEnum(StoryType)
    type!: StoryType;

    @IsString()
    @MinLength(STORY_QUESTION_MIN_LENGTH)
    @MaxLength(STORY_QUESTION_MAX_LENGTH)
    question!: string;

    @IsInt()
    @IsIn(ALLOWED_PAGE_COUNTS)
    pageCount!: number;

    @IsString()
    artStyleId!: string;

    @IsEnum(Language)
    language!: Language;
}
