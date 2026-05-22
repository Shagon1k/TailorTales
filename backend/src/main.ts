import 'reflect-metadata';
import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

const PORT = process.env.PORT ?? 3001;

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule);
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.listen(PORT);
}

bootstrap().then(() => {
    console.log('Server is running on %s port', PORT);
});
