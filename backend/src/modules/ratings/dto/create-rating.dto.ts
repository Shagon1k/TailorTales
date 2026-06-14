import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import {
    RATING_COMMENT_MAX_LENGTH,
    RATING_MAX_SCORE,
    RATING_MIN_SCORE,
} from '../ratings.constants.js';

export class CreateRatingDto {
    @IsInt()
    @Min(RATING_MIN_SCORE)
    @Max(RATING_MAX_SCORE)
    score!: number;

    @IsOptional()
    @IsString()
    @MaxLength(RATING_COMMENT_MAX_LENGTH)
    comment?: string;

    /** Opt-in to feature the story on the public landing page. Mirrors Story.isPublic. */
    @IsOptional()
    @IsBoolean()
    isPublic?: boolean;
}
