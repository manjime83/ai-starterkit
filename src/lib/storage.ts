import { env } from "@/env";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = env.AWS_S3_BUCKET_NAME
  ? new S3Client({
      endpoint: env.AWS_ENDPOINT_URL,
      region: env.AWS_DEFAULT_REGION,
      forcePathStyle: false,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  : null;

function requireS3(): S3Client {
  if (!s3) throw new Error("Storage not configured — set AWS_S3_BUCKET_NAME to enable");
  return s3;
}

const bucket = env.AWS_S3_BUCKET_NAME!;

export async function uploadFile(key: string, body: Buffer, contentType?: string) {
  await requireS3().send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
}

export async function downloadFile(key: string) {
  return requireS3().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
}

export async function deleteFile(key: string) {
  await requireS3().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function listFiles(prefix?: string) {
  return requireS3().send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }));
}

export async function getPresignedUploadUrl(key: string, expiresIn = 3600) {
  return getSignedUrl(requireS3(), new PutObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
}

export async function getPresignedDownloadUrl(key: string, expiresIn = 3600) {
  return getSignedUrl(requireS3(), new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
}
