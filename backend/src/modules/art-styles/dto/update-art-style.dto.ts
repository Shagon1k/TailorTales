import { IsBoolean, IsInt, IsOptional, IsString, Matches, MinLength } from 'class-validator';

/** @nestjs/mapped-types is not installed — optional fields are written out manually. */
export class UpdateArtStyleDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    name?: string;

    @IsOptional()
    @IsString()
    @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must be kebab-case' })
    slug?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    promptPrefix?: string;

    @IsOptional()
    @IsInt()
    order?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
