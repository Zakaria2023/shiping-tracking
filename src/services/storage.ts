import "server-only";

import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type StoredObject = {
  sizeBytes: number;
};

const requiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

// Holds the one client across calls. A box rather than a reassigned binding, so
// the module has no mutable top-level variable.
const cached: { client: S3Client | undefined } = { client: undefined };

/**
 * The S3 client pointed at Cloudflare R2, built on first use. Lazy so that the
 * build, which imports this module, does not need the R2 secrets.
 *
 *   R2_ENDPOINT          — the account-scoped R2 endpoint URL
 *   R2_ACCESS_KEY_ID     — R2 API token access key ID
 *   R2_SECRET_ACCESS_KEY — R2 API token secret
 *   R2_BUCKET_NAME       — the bucket documents live in
 */
const r2 = (): S3Client => {
  if (!cached.client) {
    cached.client = new S3Client({
      region: "auto",
      endpoint: requiredEnv("R2_ENDPOINT"),
      forcePathStyle: true,
      credentials: {
        accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
        secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
      },
    });
  }
  return cached.client;
};

const bucket = (): string => requiredEnv("R2_BUCKET_NAME");

/** A URL the browser PUTs the file to, with this exact Content-Type. Valid for 10 minutes. */
export const createUploadUrl = (key: string, contentType: string): Promise<string> =>
  getSignedUrl(r2(), new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType }), {
    expiresIn: 60 * 10,
  });

/** A URL that opens the file in the browser under its own name. Valid for 5 minutes. */
export const createDownloadUrl = (key: string, fileName: string): Promise<string> =>
  getSignedUrl(
    r2(),
    new GetObjectCommand({
      Bucket: bucket(),
      Key: key,
      ResponseContentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    }),
    { expiresIn: 60 * 5 },
  );

/** The object as stored, or null when nothing was uploaded at that key. */
export const headObject = async (key: string): Promise<StoredObject | null> => {
  try {
    const head = await r2().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
    return { sizeBytes: head.ContentLength ?? 0 };
  } catch (error) {
    if (error instanceof Error && (error.name === "NotFound" || error.name === "NoSuchKey")) {
      return null;
    }
    throw error;
  }
};

export const deleteObjects = async (keys: string[]): Promise<void> => {
  if (keys.length === 0) {
    return;
  }
  await r2().send(
    new DeleteObjectsCommand({
      Bucket: bucket(),
      Delete: { Objects: keys.map((key) => ({ Key: key })), Quiet: true },
    }),
  );
};
