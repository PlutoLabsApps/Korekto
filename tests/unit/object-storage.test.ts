import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createObjectKey,
  createObjectStorage,
  type ObjectStorageConfig,
} from '../../server/utils/object-storage'

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(),
}))

const config: ObjectStorageConfig = {
  endpoint: 'https://fsn1.your-objectstorage.com',
  region: 'fsn1',
  bucket: 'korekto-test',
  accessKeyId: 'access-key',
  secretAccessKey: 'secret-key',
}

function createClient() {
  const send = vi.fn()
  const client = { send } as unknown as S3Client

  return { client, send }
}

describe('object storage', () => {
  beforeEach(() => {
    vi.mocked(getSignedUrl).mockResolvedValue('https://signed.example.com/file')
  })

  it('uploads a file with its content metadata and returns its stored identity', async () => {
    const { client, send } = createClient()
    send.mockResolvedValue({ ETag: '"etag-123"' })
    const storage = createObjectStorage(config, client)
    const body = new Uint8Array([1, 2, 3])

    const result = await storage.upload({
      key: 'submissions/student/work.pdf',
      body,
      contentType: 'application/pdf',
      contentLength: 3,
      cacheControl: 'private, max-age=3600',
      metadata: { owner: 'student-1' },
    })

    expect(result).toEqual({ key: 'submissions/student/work.pdf', etag: '"etag-123"' })
    expect(send).toHaveBeenCalledOnce()
    const command = send.mock.calls[0]?.[0] as PutObjectCommand
    expect(command).toBeInstanceOf(PutObjectCommand)
    expect(command.input).toEqual({
      Bucket: 'korekto-test',
      Key: 'submissions/student/work.pdf',
      Body: body,
      ContentType: 'application/pdf',
      ContentLength: 3,
      CacheControl: 'private, max-age=3600',
      Metadata: { owner: 'student-1' },
    })
  })

  it('downloads the complete object body as bytes', async () => {
    const { client, send } = createClient()
    const bytes = new Uint8Array([37, 80, 68, 70])
    send.mockResolvedValue({ Body: { transformToByteArray: vi.fn().mockResolvedValue(bytes) } })
    const storage = createObjectStorage(config, client)

    await expect(storage.download('submissions/work.pdf')).resolves.toEqual(bytes)
    const command = send.mock.calls[0]?.[0] as GetObjectCommand
    expect(command).toBeInstanceOf(GetObjectCommand)
    expect(command.input).toEqual({ Bucket: 'korekto-test', Key: 'submissions/work.pdf' })
  })

  it('rejects a download when S3 returns no body', async () => {
    const { client, send } = createClient()
    send.mockResolvedValue({ Body: undefined })
    const storage = createObjectStorage(config, client)

    await expect(storage.download('submissions/missing.pdf')).rejects.toThrow(
      'Object "submissions/missing.pdf" has no body',
    )
  })

  it('removes an object from the configured bucket', async () => {
    const { client, send } = createClient()
    send.mockResolvedValue({})
    const storage = createObjectStorage(config, client)

    await storage.remove('submissions/work.pdf')

    const command = send.mock.calls[0]?.[0] as DeleteObjectCommand
    expect(command).toBeInstanceOf(DeleteObjectCommand)
    expect(command.input).toEqual({ Bucket: 'korekto-test', Key: 'submissions/work.pdf' })
  })

  it('reports that an object exists when its metadata can be read', async () => {
    const { client, send } = createClient()
    send.mockResolvedValue({})
    const storage = createObjectStorage(config, client)

    await expect(storage.exists('submissions/work.pdf')).resolves.toBe(true)
    const command = send.mock.calls[0]?.[0] as HeadObjectCommand
    expect(command).toBeInstanceOf(HeadObjectCommand)
    expect(command.input).toEqual({ Bucket: 'korekto-test', Key: 'submissions/work.pdf' })
  })

  it.each([404, 'NotFound', 'NoSuchKey'])(
    'reports a missing object without throwing for %s',
    async (notFoundKind) => {
      const { client, send } = createClient()
      const error =
        typeof notFoundKind === 'number'
          ? Object.assign(new Error('Missing'), { $metadata: { httpStatusCode: notFoundKind } })
          : Object.assign(new Error('Missing'), { name: notFoundKind })
      send.mockRejectedValue(error)
      const storage = createObjectStorage(config, client)

      await expect(storage.exists('submissions/missing.pdf')).resolves.toBe(false)
    },
  )

  it('does not hide permission and service failures when checking existence', async () => {
    const { client, send } = createClient()
    const error = Object.assign(new Error('Access denied'), {
      $metadata: { httpStatusCode: 403 },
    })
    send.mockRejectedValue(error)
    const storage = createObjectStorage(config, client)

    await expect(storage.exists('private/work.pdf')).rejects.toBe(error)
  })

  it('creates a signed download URL with a fifteen-minute default lifetime', async () => {
    const { client } = createClient()
    const storage = createObjectStorage(config, client)

    const url = await storage.getSignedDownloadUrl('submissions/work.pdf')

    expect(url).toBe('https://signed.example.com/file')
    expect(getSignedUrl).toHaveBeenCalledWith(client, expect.any(GetObjectCommand), {
      expiresIn: 900,
    })
    const command = vi.mocked(getSignedUrl).mock.calls[0]?.[1] as GetObjectCommand
    expect(command.input).toEqual({ Bucket: 'korekto-test', Key: 'submissions/work.pdf' })
  })

  it('creates a signed upload URL restricted to the declared content type', async () => {
    const { client } = createClient()
    const storage = createObjectStorage(config, client)

    const url = await storage.getSignedUploadUrl({
      key: 'submissions/work.pdf',
      contentType: 'application/pdf',
      expiresInSeconds: 60,
    })

    expect(url).toBe('https://signed.example.com/file')
    expect(getSignedUrl).toHaveBeenCalledWith(client, expect.any(PutObjectCommand), {
      expiresIn: 60,
      signableHeaders: new Set(['content-type']),
    })
    const command = vi.mocked(getSignedUrl).mock.calls[0]?.[1] as PutObjectCommand
    expect(command.input).toEqual({
      Bucket: 'korekto-test',
      Key: 'submissions/work.pdf',
      ContentType: 'application/pdf',
    })
  })

  it.each([0, -1, 1.5, 604801])('rejects an invalid signed URL lifetime of %s', async (expiry) => {
    const { client } = createClient()
    const storage = createObjectStorage(config, client)

    await expect(storage.getSignedDownloadUrl('submissions/work.pdf', expiry)).rejects.toThrow(
      'Signed URL expiry must be a whole number between 1 and 604800 seconds',
    )
    expect(getSignedUrl).not.toHaveBeenCalled()
  })

  it('accepts the maximum signed URL lifetime of seven days', async () => {
    const { client } = createClient()
    const storage = createObjectStorage(config, client)

    await storage.getSignedDownloadUrl('submissions/work.pdf', 604800)

    expect(getSignedUrl).toHaveBeenCalledWith(client, expect.any(GetObjectCommand), {
      expiresIn: 604800,
    })
  })

  it('creates unique keys with a sanitized lowercase extension', () => {
    const first = createObjectKey('Student Work.PDF', 'submissions/2026')
    const second = createObjectKey('Student Work.PDF', 'submissions/2026')

    expect(first).toMatch(
      /^submissions\/2026\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.pdf$/,
    )
    expect(second).not.toBe(first)
  })

  it('omits unsafe or unsupported filename extensions', () => {
    expect(createObjectKey('submission.<script>', 'submissions')).toMatch(
      /^submissions\/[0-9a-f-]{36}$/,
    )
  })

  it.each([
    '',
    '/absolute/file.pdf',
    '../secret.pdf',
    'submissions/../secret.pdf',
    'submissions//work.pdf',
    'submissions\\work.pdf',
    'submissions/work.pdf?version=1',
    'submissions/work.pdf#fragment',
    'submissions/\u0000work.pdf',
  ])('rejects unsafe object key %j before contacting S3', async (key) => {
    const { client, send } = createClient()
    const storage = createObjectStorage(config, client)

    await expect(storage.remove(key)).rejects.toThrow('Invalid object key')
    expect(send).not.toHaveBeenCalled()
  })

  it('rejects an unsafe prefix when generating an object key', () => {
    expect(() => createObjectKey('work.pdf', '../private')).toThrow('Invalid object key')
  })

  it.each(['endpoint', 'region', 'bucket', 'accessKeyId', 'secretAccessKey'] as const)(
    'rejects blank %s configuration',
    (field) => {
      const { client } = createClient()

      expect(() => createObjectStorage({ ...config, [field]: ' ' }, client)).toThrow(
        `Object storage ${field} is required`,
      )
    },
  )

  it('rejects a malformed object storage endpoint', () => {
    const { client } = createClient()

    expect(() => createObjectStorage({ ...config, endpoint: 'not a URL' }, client)).toThrow(
      'Object storage endpoint must be a valid HTTPS URL',
    )
  })

  it('rejects a non-HTTPS object storage endpoint', () => {
    const { client } = createClient()

    expect(() =>
      createObjectStorage({ ...config, endpoint: 'http://fsn1.your-objectstorage.com' }, client),
    ).toThrow('Object storage endpoint must be a valid HTTPS URL')
  })
})
