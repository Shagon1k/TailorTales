/**
 * Application-level error with a message safe to surface to the end user.
 * Anything else that reaches the pipeline catch block gets a generic fallback.
 */
export class AppError extends Error {
    override readonly name = 'AppError';

    constructor(message: string) {
        super(message);
    }
}
