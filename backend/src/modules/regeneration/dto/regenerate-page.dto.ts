import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export type RegenerateWhat = 'text' | 'illustration' | 'both';

export class RegeneratePageDto {
    @IsIn(['text', 'illustration', 'both'] satisfies RegenerateWhat[])
    what!: RegenerateWhat;

    /** Optional author note to guide text regeneration. Ignored for illustration-only regeneration. */
    @IsOptional()
    @IsString()
    @MaxLength(500)
    prompt?: string;
}
