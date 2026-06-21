import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import {
    CHARACTER_DESCRIPTION_MAX_LENGTH,
    CHARACTER_NAME_MAX_LENGTH,
} from '../characters.constants.js';

/** Sources a client may set directly. PHOTO is server-only (reserved, GDPR-blocked). */
export const USER_SETTABLE_CHARACTER_SOURCES = ['IMAGINED', 'QUIZ'] as const;

export class CreateCharacterDto {
    @IsString()
    @MinLength(1)
    @MaxLength(CHARACTER_NAME_MAX_LENGTH)
    name!: string;

    @IsString()
    @MinLength(1)
    @MaxLength(CHARACTER_DESCRIPTION_MAX_LENGTH)
    description!: string;

    /** Owning child — every character belongs to one child. */
    @IsString()
    childId!: string;

    /** How it was created: free-form (`IMAGINED`) or the guided quiz (`QUIZ`). Defaults to `IMAGINED`. */
    @IsOptional()
    @IsIn(USER_SETTABLE_CHARACTER_SOURCES)
    source?: (typeof USER_SETTABLE_CHARACTER_SOURCES)[number];
}
