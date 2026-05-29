import { plainToInstance } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min, validateSync } from 'class-validator';

enum Environment {
    Development = 'development',
    Production = 'production',
    Test = 'test',
}

class EnvironmentVariables {
    @IsString()
    DATABASE_URL!: string;

    @IsString()
    GOOGLE_CLIENT_ID!: string;

    @IsString()
    GOOGLE_CLIENT_SECRET!: string;

    @IsString()
    JWT_SECRET!: string;

    @IsInt()
    @Min(1)
    JWT_EXPIRY_DAYS: number = 7;

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
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
    const validated = plainToInstance(EnvironmentVariables, config, {
        enableImplicitConversion: true,
    });

    const errors = validateSync(validated, { skipMissingProperties: false });

    if (errors.length > 0) {
        throw new Error(errors.toString());
    }

    return validated;
}
