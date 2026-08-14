import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { StorageService } from '../storage.service.js';

const STORAGE_ENDPOINT = 'http://minio:9000';
const STORAGE_PUBLIC_ENDPOINT = 'http://localhost:9000';
const STORAGE_BUCKET = 'tailortales';
const OBJECT_KEY = 'covers/story-1.png';

async function compileStorageModule(
    overrides: Record<string, string | boolean> = {},
): Promise<TestingModule> {
    const configValues: Record<string, string | boolean> = {
        STORAGE_REGION: 'eu-west-1',
        STORAGE_ACCESS_KEY: 'test-access-key',
        STORAGE_SECRET_KEY: 'test-secret-key',
        STORAGE_BUCKET,
        STORAGE_FORCE_PATH_STYLE: true,
        ...overrides,
    };
    const get = vi.fn((key: string) => configValues[key]);
    const getOrThrow = vi.fn((key: string) => {
        const value = configValues[key];
        if (value === undefined) {
            throw new Error(`Missing test configuration: ${key}`);
        }
        return value;
    });

    return Test.createTestingModule({
        providers: [StorageService, { provide: ConfigService, useValue: { get, getOrThrow } }],
    }).compile();
}

describe('StorageService', () => {
    let module: TestingModule;
    let service: StorageService;

    afterEach(async () => {
        await module.close();
    });

    describe('given an explicit public storage endpoint', () => {
        beforeEach(async () => {
            module = await compileStorageModule({
                STORAGE_ENDPOINT,
                STORAGE_PUBLIC_ENDPOINT,
            });
            service = module.get(StorageService);
        });

        it('should generate browser URLs with the public endpoint', async () => {
            // Act
            const signedUrl = await service.getSignedUrl(OBJECT_KEY);

            // Assert
            const parsedUrl = new URL(signedUrl);
            expect(parsedUrl.origin).toBe(STORAGE_PUBLIC_ENDPOINT);
            expect(parsedUrl.pathname).toBe(`/${STORAGE_BUCKET}/${OBJECT_KEY}`);
        });
    });

    describe('given no public storage endpoint', () => {
        beforeEach(async () => {
            module = await compileStorageModule({ STORAGE_ENDPOINT });
            service = module.get(StorageService);
        });

        it('should fall back to the backend storage endpoint for browser URLs', async () => {
            // Act
            const signedUrl = await service.getSignedUrl(OBJECT_KEY);

            // Assert
            const parsedUrl = new URL(signedUrl);
            expect(parsedUrl.origin).toBe(STORAGE_ENDPOINT);
            expect(parsedUrl.pathname).toBe(`/${STORAGE_BUCKET}/${OBJECT_KEY}`);
        });
    });

    describe('given no custom storage endpoints', () => {
        beforeEach(async () => {
            module = await compileStorageModule({ STORAGE_FORCE_PATH_STYLE: false });
            service = module.get(StorageService);
        });

        it('should use the regional AWS S3 endpoint for browser URLs', async () => {
            // Act
            const signedUrl = await service.getSignedUrl(OBJECT_KEY);

            // Assert
            const parsedUrl = new URL(signedUrl);
            expect(parsedUrl.origin).toBe(`https://${STORAGE_BUCKET}.s3.eu-west-1.amazonaws.com`);
            expect(parsedUrl.pathname).toBe(`/${OBJECT_KEY}`);
        });
    });
});
