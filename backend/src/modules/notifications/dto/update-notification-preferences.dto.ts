import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';

export class EmailInAppPrefsDto {
    @IsOptional()
    @IsBoolean()
    email?: boolean;

    @IsOptional()
    @IsBoolean()
    inApp?: boolean;
}

/** paymentFailed — the email channel is billing-critical and not toggleable. */
export class InAppOnlyPrefsDto {
    @IsOptional()
    @IsBoolean()
    inApp?: boolean;
}

/** subscriptionRenewed — email-only event, no bell record. */
export class EmailOnlyPrefsDto {
    @IsOptional()
    @IsBoolean()
    email?: boolean;
}

/** Partial patch — only the toggles present in the body are changed. */
export class UpdateNotificationPreferencesDto {
    @IsOptional()
    @ValidateNested()
    @Type(() => EmailInAppPrefsDto)
    storyCompleted?: EmailInAppPrefsDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => EmailInAppPrefsDto)
    storyFailed?: EmailInAppPrefsDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => InAppOnlyPrefsDto)
    paymentFailed?: InAppOnlyPrefsDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => EmailInAppPrefsDto)
    subscriptionCanceled?: EmailInAppPrefsDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => EmailOnlyPrefsDto)
    subscriptionRenewed?: EmailOnlyPrefsDto;
}
