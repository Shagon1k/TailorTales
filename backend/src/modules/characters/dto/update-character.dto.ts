import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import {
    CHARACTER_DESCRIPTION_MAX_LENGTH,
    CHARACTER_NAME_MAX_LENGTH,
} from '../characters.constants.js';

export class UpdateCharacterDto {
    @IsString()
    @MinLength(1)
    @MaxLength(CHARACTER_NAME_MAX_LENGTH)
    @IsOptional()
    name?: string;

    @IsString()
    @MinLength(1)
    @MaxLength(CHARACTER_DESCRIPTION_MAX_LENGTH)
    @IsOptional()
    description?: string;
}
