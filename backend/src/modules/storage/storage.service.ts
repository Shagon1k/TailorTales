import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    CreateBucketCommand,
    DeleteObjectCommand,
    DeleteObjectsCommand,
    GetObjectCommand,
    HeadBucketCommand,
    ListObjectsV2Command,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const SIGNED_URL_DEFAULT_EXPIRY_SECONDS = 3600;

@Injectable()
export class StorageService implements OnModuleInit {
    private readonly operationsClient: S3Client;
    private readonly signingClient: S3Client;
    private readonly bucket: string;
    private readonly logger = new Logger(StorageService.name);

    constructor(private readonly config: ConfigService) {
        // Dev (MinIO): STORAGE_ENDPOINT is set for backend operations. The optional
        // STORAGE_PUBLIC_ENDPOINT is used only to generate browser-reachable signed URLs.
        // forcePathStyle must be true so the SDK uses path-style URLs (bucket/key)
        // instead of virtual-hosted ones (bucket.host/key) that MinIO doesn't support.
        //
        // Prod (AWS S3): neither endpoint is set — the SDK resolves the correct regional
        // endpoint automatically. forcePathStyle defaults to false.
        const operationsEndpoint = this.config.get<string>('STORAGE_ENDPOINT');
        const publicEndpoint =
            this.config.get<string>('STORAGE_PUBLIC_ENDPOINT') || operationsEndpoint;
        const forcePathStyle = this.config.get<boolean>('STORAGE_FORCE_PATH_STYLE') ?? false;
        const clientConfig = {
            region: this.config.getOrThrow<string>('STORAGE_REGION'),
            credentials: {
                accessKeyId: this.config.getOrThrow<string>('STORAGE_ACCESS_KEY'),
                secretAccessKey: this.config.getOrThrow<string>('STORAGE_SECRET_KEY'),
            },
            forcePathStyle,
        };
        const createClient = (clientEndpoint?: string): S3Client =>
            new S3Client({
                ...clientConfig,
                // Omit custom endpoints in production so the SDK resolves AWS S3 normally.
                ...(clientEndpoint ? { endpoint: clientEndpoint } : {}),
            });

        this.operationsClient = createClient(operationsEndpoint);
        this.signingClient =
            publicEndpoint === operationsEndpoint
                ? this.operationsClient
                : createClient(publicEndpoint);

        this.bucket = this.config.getOrThrow<string>('STORAGE_BUCKET');
    }

    async onModuleInit(): Promise<void> {
        try {
            await this.operationsClient.send(new HeadBucketCommand({ Bucket: this.bucket }));
            this.logger.log(`Storage bucket "${this.bucket}" is ready`);
        } catch {
            this.logger.log(`Bucket "${this.bucket}" not found — creating`);
            await this.operationsClient.send(new CreateBucketCommand({ Bucket: this.bucket }));
            this.logger.log(`Bucket "${this.bucket}" created`);
        }
    }

    async upload(buffer: Buffer, key: string, mimeType: string): Promise<string> {
        this.logger.log(`Uploading object: ${key}`);

        try {
            await this.operationsClient.send(
                new PutObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                    Body: buffer,
                    ContentType: mimeType,
                }),
            );

            return key;
        } catch (err: unknown) {
            this.logger.error(`Failed to upload object: ${key}`, err);
            throw err;
        }
    }

    async getSignedUrl(
        key: string,
        expiresInSeconds: number = SIGNED_URL_DEFAULT_EXPIRY_SECONDS,
    ): Promise<string> {
        try {
            return await getSignedUrl(
                this.signingClient,
                new GetObjectCommand({ Bucket: this.bucket, Key: key }),
                { expiresIn: expiresInSeconds },
            );
        } catch (err: unknown) {
            this.logger.error(`Failed to generate signed URL for: ${key}`, err);
            throw err;
        }
    }

    async downloadBuffer(key: string): Promise<Buffer> {
        try {
            const response = await this.operationsClient.send(
                new GetObjectCommand({ Bucket: this.bucket, Key: key }),
            );
            if (!response.Body) {
                throw new Error(`Object body missing for: ${key}`);
            }

            const bytes = await response.Body.transformToByteArray();
            return Buffer.from(bytes);
        } catch (err: unknown) {
            this.logger.error(`Failed to download object: ${key}`, err);
            throw err;
        }
    }

    async delete(key: string): Promise<void> {
        this.logger.log(`Deleting object: ${key}`);

        try {
            await this.operationsClient.send(
                new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
            );
        } catch (err: unknown) {
            this.logger.error(`Failed to delete object: ${key}`, err);
            throw err;
        }
    }

    /** Lists every object key under a prefix (paginated — safe for large prefixes). */
    async listKeys(prefix: string): Promise<string[]> {
        const keys: string[] = [];
        let continuationToken: string | undefined;

        do {
            const response = await this.operationsClient.send(
                new ListObjectsV2Command({
                    Bucket: this.bucket,
                    Prefix: prefix,
                    ContinuationToken: continuationToken,
                }),
            );
            for (const obj of response.Contents ?? []) {
                if (obj.Key) keys.push(obj.Key);
            }
            continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
        } while (continuationToken);

        return keys;
    }

    /**
     * Bulk delete (1000-key API batches). Returns requested vs actually deleted
     * counts so callers can log the GDPR cleanup audit line.
     */
    async deleteMany(keys: string[]): Promise<{ requested: number; deleted: number }> {
        const BATCH_SIZE = 1000;
        let deleted = 0;

        for (let i = 0; i < keys.length; i += BATCH_SIZE) {
            const batch = keys.slice(i, i + BATCH_SIZE);
            const response = await this.operationsClient.send(
                new DeleteObjectsCommand({
                    Bucket: this.bucket,
                    Delete: { Objects: batch.map((key) => ({ Key: key })) },
                }),
            );
            deleted += response.Deleted?.length ?? 0;
            for (const error of response.Errors ?? []) {
                this.logger.error(`Failed to delete object: ${error.Key} (${error.Message})`);
            }
        }

        return { requested: keys.length, deleted };
    }
}
