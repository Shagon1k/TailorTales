/**
 * Application-level error with a message safe to surface to the end user.
 * Anything else that reaches the pipeline catch block gets a generic fallback.
 */
export class AppError extends Error {
    override readonly name: string = 'AppError';

    constructor(message: string) {
        super(message);
    }
}

export class ImageProhibitedContentError extends AppError {
    override readonly name = 'ImageProhibitedContentError';

    constructor() {
        super('Image generation was blocked by the safety provider. Retrying with safer imagery.');
    }
}
