import { IsString, MaxLength, MinLength } from 'class-validator';
import { CHARACTER_PROMPT_MAX_LENGTH } from '../characters.constants.js';

export class CreateCharacterFromPromptDto {
    /** Owning child — every character belongs to one child. */
    @IsString()
    childId!: string;

    /** Free-text idea the AI expands into a character profile. */
    @IsString()
    @MinLength(1)
    @MaxLength(CHARACTER_PROMPT_MAX_LENGTH)
    prompt!: string;
}
