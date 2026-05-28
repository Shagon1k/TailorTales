import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { StoryType } from '../../../generated/prisma/client.js';
import {
    TEMPLATE_DESCRIPTION_MAX_LENGTH,
    TEMPLATE_NAME_MAX_LENGTH,
    TEMPLATE_SYSTEM_PROMPT_MAX_LENGTH,
} from '../templates.constants.js';

export class CreateTemplateDto {
    @IsString()
    @MinLength(1)
    @MaxLength(TEMPLATE_NAME_MAX_LENGTH)
    name!: string;

    @IsString()
    @MinLength(1)
    @MaxLength(TEMPLATE_DESCRIPTION_MAX_LENGTH)
    description!: string;

    @IsEnum(StoryType)
    type!: StoryType;

    @IsString()
    @MinLength(1)
    @MaxLength(TEMPLATE_SYSTEM_PROMPT_MAX_LENGTH)
    systemPrompt!: string;
}
