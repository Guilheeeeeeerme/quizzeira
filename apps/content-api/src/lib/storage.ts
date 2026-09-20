// Concept: Document store — artifact read + normalized/brief write (§35).

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
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

export async function getArtifactObject(key: string): Promise<Buffer> {
  const result = await client.send(
    new GetObjectCommand({ Bucket: env.s3Bucket, Key: key }),
  );
  const body = result.Body;
  if (!body) throw new Error(`empty object: ${key}`);
  const chunks: Buffer[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/** Persist JSON/bytes under MinIO (normalized docs, generation briefs). */
export async function putObject(
  key: string,
  body: Buffer | string,
  contentType = "application/json",
): Promise<void> {
  await client.send(
    new PutObjectCommand({
      Bucket: env.s3Bucket,
      Key: key,
      Body: typeof body === "string" ? Buffer.from(body, "utf8") : body,
      ContentType: contentType,
    }),
  );
}

export async function getJsonObject<T = unknown>(key: string): Promise<T> {
  const buf = await getArtifactObject(key);
  return JSON.parse(buf.toString("utf8")) as T;
}

/** Retention: drop raw artifact bytes once every document that shares the key
 * is terminal. Idempotent — S3 DeleteObject on a missing key is a no-op. */
export async function deleteObject(key: string): Promise<void> {
  await client.send(new DeleteObjectCommand({ Bucket: env.s3Bucket, Key: key }));
}

/** True when the object is gone (NoSuchKey / 404) rather than another error. */
export function isMissingObjectError(err: unknown): boolean {
  const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
  return e?.name === "NoSuchKey" || e?.$metadata?.httpStatusCode === 404;
}
