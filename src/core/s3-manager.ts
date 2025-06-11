import { S3Client } from 'bun';

/**
 * @file src/core/s3-manager.ts
 * @description Manages the S3 client setup and credential validation.
 */

interface S3Options {
  s3AccessKeyId?: string;
  s3SecretAccessKey?: string;
  s3Bucket?: string;
  s3Region?: string;
  s3Endpoint?: string;
}

// Helper to get credentials from options or environment variables
const getCredential = (optionValue: string | undefined, envVar: string): string => {
  return optionValue || Bun.env[envVar] || '';
};

export function setupS3Client(options: S3Options): S3Client {
  console.log('S3 path detected, setting up S3 client...');

  const accessKeyId = getCredential(options.s3AccessKeyId, 'S3_ACCESS_KEY_ID');
  const secretAccessKey = getCredential(options.s3SecretAccessKey, 'S3_SECRET_ACCESS_KEY');
  const region = getCredential(options.s3Region, 'S3_REGION');
  const endpoint = getCredential(options.s3Endpoint, 'S3_ENDPOINT');
  const bucket = getCredential(options.s3Bucket, 'S3_BUCKET'); // Although not used in client, it's good to validate

  const required = { accessKeyId, secretAccessKey, endpoint, bucket };
  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      console.error(`❌ S3 configuration error: ${key} is required. Provide it via CLI option or environment variable.`);
      process.exit(1);
    }
  }

  console.log('✅ S3 client configured successfully.');
  return new S3Client({
    accessKeyId,
    secretAccessKey,
    region,
    endpoint,
  });
}
