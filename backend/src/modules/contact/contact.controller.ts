import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator.js';
import { ContactDto } from './dto/contact.dto.js';
import { ContactService } from './contact.service.js';

@Controller('contact')
export class ContactController {
    constructor(private readonly contactService: ContactService) {}

    @Post()
    @Public()
    @HttpCode(202)
    submit(@Body() dto: ContactDto): Promise<void> {
        return this.contactService.submit(dto);
    }
}
