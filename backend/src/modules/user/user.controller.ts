import {
    Body,
    Controller,
    Delete,
    Get,
    Header,
    Patch,
    Post,
    Res,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { type User } from '../../generated/prisma/client.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AccountDeletionService } from './account-deletion.service.js';
import { DataExportService } from './data-export.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserService } from './user.service.js';
import type { ICurrentUserResponse, IUploadedAvatarFile } from './user.types.js';

const COOKIE_NAME = 'access_token';

@Controller('me')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly dataExportService: DataExportService,
        private readonly accountDeletionService: AccountDeletionService,
    ) {}

    @Get()
    getMe(@CurrentUser() user: User): Promise<ICurrentUserResponse> {
        return this.userService.presentUser(user);
    }

    @Patch()
    async updateMe(
        @CurrentUser() user: User,
        @Body() dto: UpdateUserDto,
    ): Promise<ICurrentUserResponse> {
        const updatedUser = await this.userService.updateName(user.id, dto.name);
        return this.userService.presentUser(updatedUser);
    }

    @Post('avatar')
    @UseInterceptors(FileInterceptor('avatar'))
    uploadAvatar(
        @CurrentUser() user: User,
        @UploadedFile() file: IUploadedAvatarFile | undefined,
    ): Promise<ICurrentUserResponse> {
        return this.userService.uploadAvatar(user.id, file);
    }

    @Delete('avatar')
    deleteAvatar(@CurrentUser() user: User): Promise<ICurrentUserResponse> {
        return this.userService.clearAvatar(user.id);
    }

    /** GDPR data export — structured JSON download with signed asset links. */
    @Get('export')
    @Header('Content-Disposition', 'attachment; filename="tailortales-export.json"')
    exportData(@CurrentUser() user: User): Promise<Record<string, unknown>> {
        return this.dataExportService.exportUserData(user.id);
    }

    /** GDPR account deletion — cancels billing, removes all data and assets. */
    @Delete()
    async deleteMe(@CurrentUser() user: User, @Res() res: Response): Promise<void> {
        await this.accountDeletionService.deleteAccount(user.id);
        res.clearCookie(COOKIE_NAME);
        res.sendStatus(204);
    }
}
