import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import type { User } from '../../generated/prisma/client.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { CharactersService } from './characters.service.js';
import type { ICharacterResponse } from './characters.types.js';
import { CreateCharacterDto } from './dto/create-character.dto.js';
import { CreateCharacterFromPromptDto } from './dto/create-character-from-prompt.dto.js';
import { UpdateCharacterDto } from './dto/update-character.dto.js';

@Controller('characters')
export class CharactersController {
    constructor(private readonly charactersService: CharactersService) {}

    @Get()
    findAll(
        @CurrentUser() user: User,
        @Query('childId') childId?: string,
    ): Promise<ICharacterResponse[]> {
        return this.charactersService.findAllByUser(user.id, childId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: User): Promise<ICharacterResponse> {
        return this.charactersService.findOne(id, user.id);
    }

    @Post()
    create(
        @CurrentUser() user: User,
        @Body() dto: CreateCharacterDto,
    ): Promise<ICharacterResponse> {
        return this.charactersService.create(user.id, dto);
    }

    @Post('from-prompt')
    createFromPrompt(
        @CurrentUser() user: User,
        @Body() dto: CreateCharacterFromPromptDto,
    ): Promise<ICharacterResponse> {
        return this.charactersService.createFromPrompt(user.id, dto);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @CurrentUser() user: User,
        @Body() dto: UpdateCharacterDto,
    ): Promise<ICharacterResponse> {
        return this.charactersService.update(id, user.id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    remove(@Param('id') id: string, @CurrentUser() user: User): Promise<void> {
        return this.charactersService.remove(id, user.id);
    }

    @Post(':id/preview')
    generatePreview(
        @Param('id') id: string,
        @CurrentUser() user: User,
    ): Promise<ICharacterResponse> {
        return this.charactersService.generatePreview(id, user.id);
    }
}
