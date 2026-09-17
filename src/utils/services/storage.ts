import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

import { isR2Configured, R2_BUCKET, s3Client } from '@/config/r2';

export interface UploadFileInput {
  buffer: Buffer;
  mimetype: string;
}

const PUBLIC_STORAGE_URL = (process.env.PUBLIC_STORAGE_URL || '').replace(/\/$/, '');

export async function uploadFile(
  folderName: string,
  file: UploadFileInput,
  fileName: string,
): Promise<string> {
  if (!isR2Configured || !s3Client) {
    throw new Error('Layanan penyimpanan S3/R2 belum dikonfigurasi pada server.');
  }

  const sanitizedFolder = folderName.replace(/^\/+|\/+$/g, '');
  const fileKey = sanitizedFolder ? `${sanitizedFolder}/${fileName}` : fileName;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3Client.send(command);

  return `${PUBLIC_STORAGE_URL}/${fileKey}`;
}

export async function deleteFile(fileKey: string): Promise<void> {
  if (!isR2Configured || !s3Client) {
    return;
  }

  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET,
    Key: fileKey,
  });

  await s3Client.send(command);
}

