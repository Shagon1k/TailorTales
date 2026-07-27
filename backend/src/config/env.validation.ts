import { plainToInstance } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Min,
    MinLength,
    validateSync,
} from 'class-validator';

enum Environment {
    Development = 'development',
    Production = 'production',
    Test = 'test',
}

enum PaddleEnvironment {
    Sandbox = 'sandbox',
    Production = 'production',
}

class EnvironmentVariables {
    @IsString()
    DATABASE_URL!: string;

    @IsString()
    GOOGLE_CLIENT_ID!: string;

    @IsString()
    GOOGLE_CLIENT_SECRET!: string;

    @IsString()
    @MinLength(32)
    JWT_SECRET!: string;

    @IsInt()
    @Min(1)
    JWT_EXPIRY_DAYS: number = 7;

    @IsString()
    @IsOptional()
    AUTH_ALLOWED_EMAILS?: string;

    @IsString()
    BACKEND_URL!: string;

    @IsString()
    FRONTEND_URL!: string;

    @IsEnum(Environment)
    NODE_ENV: Environment = Environment.Development;

    @IsInt()
    @Min(1)
    PORT: number = 3001;

    // Storage (AWS S3 / MinIO)
    @IsString()
    STORAGE_REGION!: string;

    @IsString()
    STORAGE_ACCESS_KEY!: string;

    @IsString()
    STORAGE_SECRET_KEY!: string;

    @IsString()
    STORAGE_BUCKET!: string;

    @IsString()
    @IsOptional()
    STORAGE_ENDPOINT?: string;

    @IsBoolean()
    @IsOptional()
    STORAGE_FORCE_PATH_STYLE: boolean = false;

    // Redis (BullMQ)
    @IsString()
    REDIS_URL!: string;

    // OpenRouter — text + image generation
    @IsString()
    OPENROUTER_API_KEY!: string;

    @IsString()
    OPENROUTER_TEXT_MODEL!: string;

    @IsString()
    OPENROUTER_IMAGE_MODEL!: string;

    @IsBoolean()
    @IsOptional()
    USE_AI_STUBS: boolean = false;

    @IsBoolean()
    @IsOptional()
    USE_EMAIL_STUBS: boolean = false;

    // Resend — transactional email (story completed/failed, contact form)
    @IsString()
    RESEND_API_KEY!: string;

    @IsString()
    RESEND_FROM!: string;

    /** Where contact-form submissions are routed. */
    @IsString()
    CONTACT_INBOX_EMAIL!: string;

    // Sentry — error tracking
    @IsBoolean()
    @IsOptional()
    SENTRY_ENABLED: boolean = false;

    @IsString()
    @IsOptional()
    SENTRY_DSN?: string;

    @IsString()
    @IsOptional()
    SENTRY_ENVIRONMENT?: string;

    // Paddle — billing. Keys are optional because the stub client (USE_PADDLE_STUBS)
    // needs none of them; the real client throws at boot when they are missing.
    @IsBoolean()
    @IsOptional()
    USE_PADDLE_STUBS: boolean = false;

    @IsString()
    @IsOptional()
    PADDLE_API_KEY?: string;

    @IsString()
    @IsOptional()
    PADDLE_WEBHOOK_SECRET?: string;

    @IsEnum(PaddleEnvironment)
    @IsOptional()
    PADDLE_ENVIRONMENT: PaddleEnvironment = PaddleEnvironment.Sandbox;
}

const BOOLEAN_KEYS: Array<keyof EnvironmentVariables> = [
    'USE_AI_STUBS',
    'USE_EMAIL_STUBS',
    'USE_PADDLE_STUBS',
    'STORAGE_FORCE_PATH_STYLE',
    'SENTRY_ENABLED',
];

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
    const coerced: Record<string, unknown> = { ...config };
    for (const key of BOOLEAN_KEYS) {
        const v = coerced[key];
        coerced[key] = v === 'true' || v === true;
    }

    const validated = plainToInstance(EnvironmentVariables, coerced, {
        enableImplicitConversion: true,
    });

    const errors = validateSync(validated, { skipMissingProperties: false });

    if (errors.length > 0) {
        throw new Error(errors.toString());
    }

    return validated;
}
