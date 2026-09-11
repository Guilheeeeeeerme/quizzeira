// Concept: Document store (read side — extraction pulls artifact bytes)
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
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
