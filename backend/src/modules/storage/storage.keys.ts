/**
 * Central registry of all S3 key patterns used in the application.
 * Always store these keys in the DB, never the signed/public URL.
 * The URL is derived at serve time via StorageService.getSignedUrl().
 */
export const StorageKeys = {
    /** User-uploaded account avatar. Private — signed URL after ownership check. */
    userAvatar: (userId: string): string => `users/${userId}/profile/avatar`,

    /** Full PDF of a completed story. Private — signed URL after ownership check. */
    storyPdf: (userId: string, storyId: string): string =>
        `users/${userId}/stories/${storyId}/story.pdf`,

    /** Cover image of a story (first spread illustration). Private — signed URL after ownership check.
     *  For public stories, getSignedUrl() is still used; pre-signing is local computation, not an S3 call. */
    storyCover: (userId: string, storyId: string): string =>
        `users/${userId}/stories/${storyId}/cover`,

    /** Individual page illustration. Private — signed URL after ownership check. */
    pageIllustration: (userId: string, storyId: string, order: number): string =>
        `users/${userId}/stories/${storyId}/pages/${order}`,

    /** Template card thumbnail. Admin-uploaded. */
    templateCover: (templateId: string): string => `templates/${templateId}/cover`,

    /** Template example spread images. Admin-uploaded. */
    templatePreview: (templateId: string, index: number): string =>
        `templates/${templateId}/previews/${index}`,

    /** AI-generated preview image for a Character. Private — signed URL after ownership check. */
    characterPreview: (userId: string, characterId: string): string =>
        `users/${userId}/characters/${characterId}/preview`,

    /** AI-generated sample thumbnail for an ArtStyle. Admin-generated; signed at serve time. */
    artStyleThumbnail: (artStyleId: string): string => `art-styles/${artStyleId}/thumbnail`,
};
