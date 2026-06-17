import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Rating } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateRatingDto } from './dto/create-rating.dto.js';
import type { IAdminRating } from './ratings.types.js';

@Injectable()
export class RatingsService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Upsert the user's rating for their own story (one rating per user per story).
     * Mirrors the "share as an example" toggle onto Story.isPublic when provided.
     */
    async upsert(storyId: string, userId: string, dto: CreateRatingDto): Promise<Rating> {
        // Ownership check via { id, userId } — NotFound (not Forbidden) avoids leaking existence.
        const story = await this.prisma.story.findFirst({
            where: { id: storyId, userId },
            select: { status: true },
        });
        if (!story) throw new NotFoundException(`Story ${storyId} not found`);
        if (story.status !== 'COMPLETED') {
            throw new BadRequestException('errors.ratings.storyNotCompleted');
        }

        const [rating] = await this.prisma.$transaction([
            this.prisma.rating.upsert({
                where: { storyId_userId: { storyId, userId } },
                create: { storyId, userId, score: dto.score, comment: dto.comment ?? null },
                update: { score: dto.score, comment: dto.comment ?? null },
            }),
            // Only touch visibility when the toggle was sent; leave it untouched otherwise.
            ...(dto.isPublic === undefined
                ? []
                : [
                      this.prisma.story.update({
                          where: { id: storyId },
                          data: { isPublic: dto.isPublic },
                      }),
                  ]),
        ]);

        return rating;
    }

    /** Admin feedback view — every rating with story + author context, newest first. */
    findAllForAdmin(): Promise<IAdminRating[]> {
        return this.prisma.rating.findMany({
            include: {
                story: { select: { id: true, title: true, question: true, isPublic: true } },
                user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
