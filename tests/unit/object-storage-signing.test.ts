import { S3Client } from '@aws-sdk/client-s3'
import { describe, expect, it } from 'vitest'
import { createObjectStorage } from '../../server/utils/object-storage'

describe('object storage signing contract', () => {
  it('signs the content type required by direct upload URLs', async () => {
    const client = new S3Client({
      endpoint: 'https://fsn1.your-objectstorage.com',
      region: 'fsn1',
      credentials: {
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
      },
      forcePathStyle: false,
    })
    const storage = createObjectStorage(
      {
        endpoint: 'https://fsn1.your-objectstorage.com',
        region: 'fsn1',
        bucket: 'korekto-test',
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
      },
      client,
    )

    const signedUrl = await storage.getSignedUploadUrl({
      key: 'submissions/work.pdf',
      contentType: 'application/pdf',
    })
    const url = new URL(signedUrl)

    expect(url.searchParams.get('X-Amz-SignedHeaders')?.split(';')).toEqual([
      'content-type',
      'host',
    ])
  })
})
