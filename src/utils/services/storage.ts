import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

import { R2_BUCKET, s3Client } from '@/config/r2';

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
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET,
    Key: fileKey,
  });

  await s3Client.send(command);
}
