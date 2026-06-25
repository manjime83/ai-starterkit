import { env } from "@/env";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let s3: S3Client | null = null;

function getStorageConfig() {
  if (
    !env.AWS_ENDPOINT_URL ||
    !env.AWS_DEFAULT_REGION ||
    !env.AWS_ACCESS_KEY_ID ||
    !env.AWS_SECRET_ACCESS_KEY ||
    !env.AWS_S3_BUCKET_NAME
  ) {
    throw new Error("Storage not configured. Set the AWS_* bucket environment variables to enable file uploads.");
  }

  return {
    bucket: env.AWS_S3_BUCKET_NAME,
    endpoint: env.AWS_ENDPOINT_URL,
    region: env.AWS_DEFAULT_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    forcePathStyle: env.AWS_S3_FORCE_PATH_STYLE,
  };
}

function getStorage() {
  const config = getStorageConfig();

  if (!s3) {
    s3 = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: config.forcePathStyle,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  return { bucket: config.bucket, client: s3 };
}

export async function uploadFile(key: string, body: Buffer, contentType?: string) {
  const { bucket, client } = getStorage();
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
}

export async function downloadFile(key: string) {
  const { bucket, client } = getStorage();
  return client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
}

export async function deleteFile(key: string) {
  const { bucket, client } = getStorage();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function listFiles(prefix?: string) {
  const { bucket, client } = getStorage();
  return client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }));
}

export async function getPresignedUploadUrl(key: string, contentType?: string, expiresIn = 3600) {
  const { bucket, client } = getStorage();
  return getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }), {
    expiresIn,
  });
}

export async function getPresignedDownloadUrl(key: string, expiresIn = 3600) {
  const { bucket, client } = getStorage();
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
}
