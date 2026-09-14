import { HeadBucketCommand } from '@aws-sdk/client-s3';
import { s3Client, R2_BUCKET } from '@/config/r2';
import { uploadFile, deleteFile } from '@/utils/services/storage';

describe('S3/R2 Client Integration Test', () => {
  it('should successfully connect to the bucket and verify access', async () => {
    const command = new HeadBucketCommand({
      Bucket: R2_BUCKET,
    });

    const response = await s3Client.send(command);
    expect(response.$metadata.httpStatusCode).toBe(200);
  });
});

describe('S3/R2 Upload and Delete Integration Test', () => {
  const folderName = 'test-integration';
  const fileName = `test-${Date.now()}.txt`;
  const fileKey = `${folderName}/${fileName}`;

  const dummyFile = {
    buffer: Buffer.from('File ini cuma buat test aja'),
    mimetype: 'text/plain',
  };

  it('should successfully upload a file and return the public URL', async () => {
    const url = await uploadFile(folderName, dummyFile, fileName);

    expect(typeof url).toBe('string');
    expect(url).toContain(folderName);
    expect(url).toContain(fileName);
  });

  it('should successfully delete the uploaded file', async () => {
    await expect(deleteFile(fileKey)).resolves.not.toThrow();
  });
});
