import { IsString, MaxLength, MinLength } from 'class-validator';
import {
    CHARACTER_DESCRIPTION_MAX_LENGTH,
    CHARACTER_NAME_MAX_LENGTH,
} from '../characters.constants.js';

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
}
