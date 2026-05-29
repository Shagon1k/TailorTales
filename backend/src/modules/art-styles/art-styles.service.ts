import { Injectable } from '@nestjs/common';
import type { ArtStyle } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class ArtStylesService {
    constructor(private readonly prisma: PrismaService) {}

    findAllActive(): Promise<ArtStyle[]> {
        return this.prisma.artStyle.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
        });
    }
}
