import { env } from "@/lib/env";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: env.AWS_REGION,
  endpoint: env.BUCKET_ENDPOINT, // only set for non-AWS S3-compatible hosts
  forcePathStyle: env.BUCKET_FORCE_PATH_STYLE,
  credentials: { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY },
});

export async function uploadFile(key: string, body: Buffer, contentType?: string) {
  await s3.send(new PutObjectCommand({ Bucket: env.BUCKET_NAME, Key: key, Body: body, ContentType: contentType }));
}

export async function downloadFile(key: string) {
  return s3.send(new GetObjectCommand({ Bucket: env.BUCKET_NAME, Key: key }));
}

export async function deleteFile(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: env.BUCKET_NAME, Key: key }));
}

export async function listFiles(prefix?: string) {
  return s3.send(new ListObjectsV2Command({ Bucket: env.BUCKET_NAME, Prefix: prefix }));
}

export async function getPresignedUploadUrl(key: string, contentType?: string, expiresIn = 3600) {
  return getSignedUrl(s3, new PutObjectCommand({ Bucket: env.BUCKET_NAME, Key: key, ContentType: contentType }), {
    expiresIn,
  });
}

export async function getPresignedDownloadUrl(key: string, expiresIn = 3600) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: env.BUCKET_NAME, Key: key }), { expiresIn });
}
