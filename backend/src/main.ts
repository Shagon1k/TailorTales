import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

const PORT = process.env.PORT ?? 3001;

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule);
    await app.listen(PORT);
}

bootstrap().then(() => {
    console.log('Server is running on %s port', PORT);
});
