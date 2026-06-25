import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';

/**
 * GDPR data export (Art. 20): every personal-data row the user owns, plus
 * signed download links for generated assets that still exist. Keys are
 * never exposed — only short-lived signed URLs.
 */
@Injectable()
export class DataExportService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
    ) {}

    async exportUserData(userId: string): Promise<Record<string, unknown>> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                children: true,
                characters: true,
                notifications: true,
                subscription: { include: { pricingTier: true } },
                stories: { include: { pages: true, artStyle: { select: { name: true } } } },
            },
        });
        if (!user) throw new NotFoundException(`User ${userId} not found`);

        const signIfPresent = async (key: string | null): Promise<string | null> =>
            key ? this.storage.getSignedUrl(key) : null;

        const stories = await Promise.all(
            user.stories.map(async (story) => ({
                id: story.id,
                type: story.type,
                status: story.status,
                question: story.question,
                title: story.title,
                pageCount: story.pageCount,
                artStyle: story.artStyle.name,
                language: story.language,
                styleAnchor: story.styleAnchor,
                isPublic: story.isPublic,
                createdAt: story.createdAt,
                pdfUrl: await signIfPresent(story.pdfKey),
                coverImageUrl: await signIfPresent(story.coverImageKey),
                pages: await Promise.all(
                    story.pages.map(async (page) => {
                        const illustrations = page.illustrations as Array<{ key: string }> | null;
                        return {
                            order: page.order,
                            chapterTitle: page.chapterTitle,
                            text: page.text,
                            layout: page.layout,
                            illustrationPrompt: page.illustrationPrompt,
                            illustrationUrls: await Promise.all(
                                (illustrations ?? []).map((i) => this.storage.getSignedUrl(i.key)),
                            ),
                        };
                    }),
                ),
            })),
        );

        return {
            exportedAt: new Date().toISOString(),
            profile: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatarUrl: user.avatarUrl,
                role: user.role,
                createdAt: user.createdAt,
            },
            subscription: user.subscription
                ? {
                      tier: user.subscription.pricingTier.name,
                      status: user.subscription.status,
                      currentPeriodEnd: user.subscription.currentPeriodEnd,
                      pagesUsed: user.subscription.pagesUsed,
                      regenerationsUsed: user.subscription.regenerationsUsed,
                      characterGenerationsUsed:
                          (
                              user.subscription as typeof user.subscription & {
                                  characterGenerationsUsed?: number | null;
                              }
                          ).characterGenerationsUsed ?? 0,
                  }
                : null,
            children: user.children.map((child) => ({
                id: child.id,
                name: child.name,
                birthdate: child.birthdate,
                gender: child.gender,
                interests: child.interests,
            })),
            characters: await Promise.all(
                user.characters.map(async (character) => ({
                    id: character.id,
                    name: character.name,
                    description: character.description,
                    previewImageUrl: await signIfPresent(character.previewKey),
                })),
            ),
            stories,
            notifications: user.notifications.map((n) => ({
                type: n.type,
                payload: n.payload,
                readAt: n.readAt,
                createdAt: n.createdAt,
            })),
        };
    }
}
