import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import {
    CONTACT_MESSAGE_MAX_LENGTH,
    CONTACT_MESSAGE_MIN_LENGTH,
    CONTACT_NAME_MAX_LENGTH,
} from '../contact.constants.js';

export class ContactDto {
    @IsString()
    @MinLength(1)
    @MaxLength(CONTACT_NAME_MAX_LENGTH)
    name!: string;

    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(CONTACT_MESSAGE_MIN_LENGTH)
    @MaxLength(CONTACT_MESSAGE_MAX_LENGTH)
    message!: string;
}
