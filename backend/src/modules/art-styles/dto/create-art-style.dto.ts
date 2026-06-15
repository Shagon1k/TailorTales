import { IsBoolean, IsInt, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateArtStyleDto {
    @IsString()
    @MinLength(1)
    name!: string;

    @IsString()
    @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must be kebab-case' })
    slug!: string;

    @IsString()
    @MinLength(1)
    promptPrefix!: string;

    @IsInt()
    order!: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
