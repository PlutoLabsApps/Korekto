import { randomUUID } from 'node:crypto'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { useRuntimeConfig } from '#imports'

const DEFAULT_SIGNED_URL_EXPIRY_SECONDS = 15 * 60
const MAX_SIGNED_URL_EXPIRY_SECONDS = 7 * 24 * 60 * 60

export interface ObjectStorageConfig {
  endpoint: string
  region: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
}

export interface UploadObjectInput {
  key: string
  body: Uint8Array | string
  contentType: string
  contentLength?: number
  cacheControl?: string
  metadata?: Record<string, string>
}

export interface StoredObject {
  key: string
  etag?: string
}

export interface SignedUploadInput {
  key: string
  contentType: string
  expiresInSeconds?: number
}

export interface ObjectStorage {
  upload(input: UploadObjectInput): Promise<StoredObject>
  download(key: string): Promise<Uint8Array>
  remove(key: string): Promise<void>
  exists(key: string): Promise<boolean>
  getSignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>
  getSignedUploadUrl(input: SignedUploadInput): Promise<string>
}

function validateObjectKey(key: string): string {
  const hasControlCharacters = [...key].some((character) => {
    const code = character.charCodeAt(0)
    return code <= 0x1f || code === 0x7f
  })
  const hasUnsafeCharacters = hasControlCharacters || /[\\?#]/.test(key)
  const hasUnsafeSegments = key
    .split('/')
    .some((segment) => !segment || segment === '.' || segment === '..')

  if (
    !key ||
    key.length > 1024 ||
    key.startsWith('/') ||
    hasUnsafeCharacters ||
    hasUnsafeSegments
  ) {
    throw new Error(`Invalid object key: ${JSON.stringify(key)}`)
  }

  return key
}

function validateExpiry(expiresInSeconds: number): number {
  if (
    !Number.isInteger(expiresInSeconds) ||
    expiresInSeconds < 1 ||
    expiresInSeconds > MAX_SIGNED_URL_EXPIRY_SECONDS
  ) {
    throw new Error('Signed URL expiry must be a whole number between 1 and 604800 seconds')
  }

  return expiresInSeconds
}

function validateConfig(config: ObjectStorageConfig): ObjectStorageConfig {
  const normalized = Object.fromEntries(
    Object.entries(config).map(([key, value]) => [key, value.trim()]),
  ) as unknown as ObjectStorageConfig

  for (const field of ['endpoint', 'region', 'bucket', 'accessKeyId', 'secretAccessKey'] as const) {
    if (!normalized[field]) {
      throw new Error(`Object storage ${field} is required`)
    }
  }

  let endpoint: URL
  try {
    endpoint = new URL(normalized.endpoint)
  } catch {
    throw new Error('Object storage endpoint must be a valid HTTPS URL')
  }

  if (endpoint.protocol !== 'https:') {
    throw new Error('Object storage endpoint must be a valid HTTPS URL')
  }

  return normalized
}

function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  const { name, $metadata } = error as {
    name?: string
    $metadata?: { httpStatusCode?: number }
  }

  return name === 'NotFound' || name === 'NoSuchKey' || $metadata?.httpStatusCode === 404
}

class S3ObjectStorage implements ObjectStorage {
  private readonly config: ObjectStorageConfig

  constructor(
    config: ObjectStorageConfig,
    private readonly client: S3Client,
  ) {
    this.config = validateConfig(config)
  }

  async upload(input: UploadObjectInput): Promise<StoredObject> {
    const key = validateObjectKey(input.key)
    const response = await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: input.body,
        ContentType: input.contentType,
        ...(input.contentLength === undefined ? {} : { ContentLength: input.contentLength }),
        ...(input.cacheControl === undefined ? {} : { CacheControl: input.cacheControl }),
        ...(input.metadata === undefined ? {} : { Metadata: input.metadata }),
      }),
    )

    return {
      key,
      ...(response.ETag === undefined ? {} : { etag: response.ETag }),
    }
  }

  async download(key: string): Promise<Uint8Array> {
    const validKey = validateObjectKey(key)
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.config.bucket, Key: validKey }),
    )

    if (!response.Body) {
      throw new Error(`Object ${JSON.stringify(validKey)} has no body`)
    }

    return response.Body.transformToByteArray()
  }

  async remove(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.config.bucket, Key: validateObjectKey(key) }),
    )
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.config.bucket, Key: validateObjectKey(key) }),
      )
      return true
    } catch (error) {
      if (isNotFoundError(error)) {
        return false
      }
      throw error
    }
  }

  async getSignedDownloadUrl(
    key: string,
    expiresInSeconds = DEFAULT_SIGNED_URL_EXPIRY_SECONDS,
  ): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.config.bucket, Key: validateObjectKey(key) }),
      { expiresIn: validateExpiry(expiresInSeconds) },
    )
  }

  getSignedUploadUrl(input: SignedUploadInput): Promise<string> {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: validateObjectKey(input.key),
        ContentType: input.contentType,
      }),
      {
        expiresIn: validateExpiry(input.expiresInSeconds ?? DEFAULT_SIGNED_URL_EXPIRY_SECONDS),
        signableHeaders: new Set(['content-type']),
      },
    )
  }
}

export function createObjectStorage(config: ObjectStorageConfig, client?: S3Client): ObjectStorage {
  const validConfig = validateConfig(config)
  const s3Client =
    client ??
    new S3Client({
      endpoint: validConfig.endpoint,
      region: validConfig.region,
      credentials: {
        accessKeyId: validConfig.accessKeyId,
        secretAccessKey: validConfig.secretAccessKey,
      },
      forcePathStyle: false,
    })

  return new S3ObjectStorage(validConfig, s3Client)
}

export function createObjectKey(filename: string, prefix = 'uploads'): string {
  const extension = filename.match(/\.[a-z0-9]{1,10}$/i)?.[0].toLowerCase() ?? ''
  const key = `${randomUUID()}${extension}`

  return prefix ? `${validateObjectKey(prefix)}/${key}` : key
}

let objectStorage: ObjectStorage | undefined

export function useObjectStorage(): ObjectStorage {
  if (!objectStorage) {
    const config = useRuntimeConfig()
    objectStorage = createObjectStorage({
      endpoint: config.objectStorage.endpoint,
      region: config.objectStorage.region,
      bucket: config.objectStorage.bucket,
      accessKeyId: config.objectStorage.accessKeyId,
      secretAccessKey: config.objectStorage.secretAccessKey,
    })
  }

  return objectStorage
}
