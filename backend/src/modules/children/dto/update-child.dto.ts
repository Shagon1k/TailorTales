import {
    ArrayMaxSize,
    IsArray,
    IsDateString,
    IsEnum,
    IsOptional,
    IsString,
    IsUrl,
    MaxLength,
    MinLength,
    Validate,
} from 'class-validator';
import { Gender } from '../../../generated/prisma/client.js';
import {
    CHILD_INTEREST_MAX_LENGTH,
    CHILD_INTERESTS_MAX_COUNT,
    CHILD_NAME_MAX_LENGTH,
} from '../children.constants.js';
import { IsBirthdateInRange } from './create-child.dto.js';

export class UpdateChildDto {
    @IsString()
    @MinLength(1)
    @MaxLength(CHILD_NAME_MAX_LENGTH)
    @IsOptional()
    name?: string;

    @IsDateString()
    @Validate(IsBirthdateInRange)
    @IsOptional()
    birthdate?: string;

    @IsEnum(Gender)
    @IsOptional()
    gender?: Gender;

    @IsArray()
    @IsString({ each: true })
    @MaxLength(CHILD_INTEREST_MAX_LENGTH, { each: true })
    @ArrayMaxSize(CHILD_INTERESTS_MAX_COUNT)
    @IsOptional()
    interests?: string[];

    @IsUrl()
    @IsOptional()
    avatarUrl?: string;
}
