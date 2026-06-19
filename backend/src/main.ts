import 'reflect-metadata';
import './instrument.js';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/http-exception.filter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ?? 3001;

async function bootstrap(): Promise<void> {
    // rawBody is required for Paddle webhook signature verification (req.rawBody)
    const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
    const configService = app.get(ConfigService);

    app.useStaticAssets(join(__dirname, 'modules', 'rendering', 'assets', 'fonts'), {
        prefix: '/static/fonts',
        setHeaders: (res) => res.setHeader('Access-Control-Allow-Origin', '*'),
    });
    app.enableCors({
        origin: configService.getOrThrow<string>('FRONTEND_URL'),
        credentials: true,
    });
    app.use(cookieParser());
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.listen(PORT);
}

bootstrap().then(() => {
    console.log('Server is running on %s port', PORT);
});
