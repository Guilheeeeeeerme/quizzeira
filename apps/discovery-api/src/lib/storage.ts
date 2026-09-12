// Concept: Document store (MinIO object put for PDFs/editais)
import { CreateBucketCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";
import { env } from "./env";

const client = new S3Client({
  region: env.s3Region,
  endpoint: env.s3Endpoint,
  forcePathStyle: env.s3ForcePathStyle,
  credentials: {
    accessKeyId: env.s3AccessKeyId,
    secretAccessKey: env.s3SecretAccessKey,
  },
});

let bucketReady = false;

async function ensureBucket(): Promise<void> {
  if (bucketReady) return;
  try {
    await client.send(new HeadBucketCommand({ Bucket: env.s3Bucket }));
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: env.s3Bucket }));
  }
  bucketReady = true;
}

export function contentAddressedArtifactKey(checksumHex: string, contentType?: string): string {
  const ext =
    contentType?.includes("pdf")
      ? ".pdf"
      : contentType?.includes("html")
        ? ".html"
        : contentType?.includes("word") || contentType?.includes("docx")
          ? ".docx"
          : "";
  return `artifacts/${checksumHex}${ext}`;
}

export async function putArtifactObject(
  key: string | null | undefined,
  body: Buffer,
  contentType: string,
): Promise<{ storageKey: string; checksum: string; byteSize: number }> {
  await ensureBucket();
  const checksum = createHash("sha256").update(body).digest("hex");
  const storageKey = key?.trim() || contentAddressedArtifactKey(checksum, contentType);
  await client.send(
    new PutObjectCommand({
      Bucket: env.s3Bucket,
      Key: storageKey,
      Body: body,
      ContentType: contentType,
    }),
  );
  return { storageKey, checksum, byteSize: body.byteLength };
}
