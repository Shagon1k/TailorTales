import { plainToInstance } from 'class-transformer';
import { IsEnum, IsInt, IsString, Min, validateSync } from 'class-validator';

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

    @IsString()
    FRONTEND_URL!: string;

    @IsEnum(Environment)
    NODE_ENV: Environment = Environment.Development;

    @IsInt()
    @Min(1)
    PORT: number = 3001;
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
