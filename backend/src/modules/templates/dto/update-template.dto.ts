import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { StoryType } from '../../../generated/prisma/client.js';
import {
    TEMPLATE_DESCRIPTION_MAX_LENGTH,
    TEMPLATE_NAME_MAX_LENGTH,
    TEMPLATE_SYSTEM_PROMPT_MAX_LENGTH,
} from '../templates.constants.js';

export class UpdateTemplateDto {
    @IsString()
    @MinLength(1)
    @MaxLength(TEMPLATE_NAME_MAX_LENGTH)
    @IsOptional()
    name?: string;

    @IsString()
    @MinLength(1)
    @MaxLength(TEMPLATE_DESCRIPTION_MAX_LENGTH)
    @IsOptional()
    description?: string;

    @IsEnum(StoryType)
    @IsOptional()
    type?: StoryType;

    @IsString()
    @MinLength(1)
    @MaxLength(TEMPLATE_SYSTEM_PROMPT_MAX_LENGTH)
    @IsOptional()
    systemPrompt?: string;
}
