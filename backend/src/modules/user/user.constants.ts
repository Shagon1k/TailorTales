export const USER_AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export const USER_AVATAR_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type TUserAvatarMimeType = (typeof USER_AVATAR_ALLOWED_MIME_TYPES)[number];
