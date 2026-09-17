import { S3Client } from '@aws-sdk/client-s3';
import logger from '@/utils/core/logger';

const { S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET_NAME } = process.env;

export const isR2Configured: boolean = Boolean(
  S3_ENDPOINT && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY && S3_BUCKET_NAME,
);

if (!isR2Configured) {
  logger.warn(
    '[S3/R2] Missing S3/R2 environment variables. File upload to Cloudflare R2 is disabled until configured.',
  );
}

export const s3Client: S3Client | null = isR2Configured
  ? new S3Client({
      region: 'auto',
      endpoint: S3_ENDPOINT!,
      credentials: {
        accessKeyId: S3_ACCESS_KEY_ID!,
        secretAccessKey: S3_SECRET_ACCESS_KEY!,
      },
    })
  : null;

export const R2_BUCKET: string = S3_BUCKET_NAME || '';

