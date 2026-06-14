import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class ReorderArtStylesDto {
    /** Art style ids in their new display order — index becomes the `order` value. */
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    orderedIds!: string[];
}
