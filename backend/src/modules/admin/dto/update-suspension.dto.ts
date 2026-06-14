import { IsBoolean } from 'class-validator';

export class UpdateSuspensionDto {
    @IsBoolean()
    suspended!: boolean;
}
