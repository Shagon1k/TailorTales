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
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { Gender } from '../../generated/prisma/client.js';
import {
    CHILD_INTEREST_MAX_LENGTH,
    CHILD_INTERESTS_MAX_COUNT,
    CHILD_MAX_AGE_YEARS,
    CHILD_NAME_MAX_LENGTH,
} from '../children.constants.js';

const CHILD_MAX_AGE_MS = CHILD_MAX_AGE_YEARS * 365.25 * 24 * 60 * 60 * 1000;

@ValidatorConstraint({ name: 'isBirthdateInRange', async: false })
export class IsBirthdateInRange implements ValidatorConstraintInterface {
    validate(value: string): boolean {
        const date = new Date(value);
        if (isNaN(date.getTime())) return false;
        const now = new Date();
        const earliest = new Date(now.getTime() - CHILD_MAX_AGE_MS);
        return date >= earliest && date <= now;
    }

    defaultMessage(): string {
        return `birthdate must be a date within the last ${CHILD_MAX_AGE_YEARS} years`;
    }
}

export class CreateChildDto {
    @IsString()
    @MinLength(1)
    @MaxLength(CHILD_NAME_MAX_LENGTH)
    name!: string;

    @IsDateString()
    @Validate(IsBirthdateInRange)
    birthdate!: string;

    @IsEnum(Gender)
    gender!: Gender;

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
