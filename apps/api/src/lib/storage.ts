import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env } from "./env";

const client = new S3Client({
  endpoint: env.s3Endpoint,
  region: env.s3Region,
  credentials: {
    accessKeyId: env.s3AccessKeyId,
    secretAccessKey: env.s3SecretAccessKey,
  },
  forcePathStyle: env.s3ForcePathStyle,
});

let bucketReady: Promise<void> | null = null;

async function ensureBucket(): Promise<void> {
  if (!bucketReady) {
    bucketReady = (async () => {
      try {
        await client.send(new HeadBucketCommand({ Bucket: env.s3Bucket }));
      } catch {
        await client.send(new CreateBucketCommand({ Bucket: env.s3Bucket }));
      }
    })();
  }
  await bucketReady;
}

export async function putObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await ensureBucket();
  await client.send(
    new PutObjectCommand({
      Bucket: env.s3Bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  await ensureBucket();
  const result = await client.send(
    new GetObjectCommand({ Bucket: env.s3Bucket, Key: key }),
  );
  const bytes = await result.Body?.transformToByteArray();
  if (!bytes) throw new Error("Empty object");
  return Buffer.from(bytes);
}

export async function deleteObject(key: string): Promise<void> {
  try {
    await ensureBucket();
    await client.send(new DeleteObjectCommand({ Bucket: env.s3Bucket, Key: key }));
  } catch {
    // best-effort cleanup
  }
}
