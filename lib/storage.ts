import { env } from "@/lib/env";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: env.BUCKET_REGION,
  credentials: {
    accessKeyId: env.BUCKET_ACCESS_KEY_ID,
    secretAccessKey: env.BUCKET_SECRET_ACCESS_KEY,
  },
  endpoint: env.BUCKET_ENDPOINT,
  forcePathStyle: env.BUCKET_FORCE_PATH_STYLE,
});

export async function uploadFile(key: string, body: Uint8Array | Buffer | string, contentType?: string) {
  await s3.send(new PutObjectCommand({ Bucket: env.BUCKET_NAME, Key: key, Body: body, ContentType: contentType }));
}

export async function downloadFile(key: string) {
  const result = await s3.send(new GetObjectCommand({ Bucket: env.BUCKET_NAME, Key: key }));
  return result.Body;
}

export async function headFile(key: string) {
  const result = await s3.send(new HeadObjectCommand({ Bucket: env.BUCKET_NAME, Key: key }));
  return {
    contentLength: result.ContentLength,
    contentType: result.ContentType,
    contentDisposition: result.ContentDisposition,
  };
}

export async function deleteFile(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: env.BUCKET_NAME, Key: key }));
}

export async function listFiles(prefix?: string) {
  const result = await s3.send(new ListObjectsV2Command({ Bucket: env.BUCKET_NAME, Prefix: prefix }));
  return result.Contents ?? [];
}

export async function getPresignedUploadUrl({
  key,
  contentType,
  contentLength,
  contentDisposition,
  expiresIn = 300,
}: {
  key: string;
  contentType: string;
  contentLength: number;
  contentDisposition: string;
  expiresIn?: number;
}) {
  const command = new PutObjectCommand({
    Bucket: env.BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
    ContentDisposition: contentDisposition,
  });

  // Signing these headers means the upload must match the exact values the action approved.
  return getSignedUrl(s3, command, {
    expiresIn,
    signableHeaders: new Set(["content-type", "content-length", "content-disposition"]),
  });
}

export async function getPresignedDownloadUrl(key: string, expiresIn = 3600) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: env.BUCKET_NAME, Key: key }), { expiresIn });
}
