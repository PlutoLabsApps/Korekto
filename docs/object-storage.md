# Hetzner Object Storage

## Mandatory rule for all contributors and AI agents

**Store every application file in Hetzner Object Storage.** This includes images, scans, PDFs, submissions, attachments, exports, generated documents, and any future binary or text file owned by the application.

Use `useObjectStorage()` from `server/utils/object-storage.ts` in server code. Do not write application files to `public/`, `static/`, `uploads/`, the Nuxt output directory, container volumes, or another local filesystem path. Do not add a local-disk fallback, store file contents in a database, or call the AWS SDK directly from individual endpoints. Static assets shipped with the source code, such as icons and CSS, are part of the application build rather than application files.

The application container can be replaced at any time. Local disk is therefore never a source of truth. Persist an object's key and its metadata in application data; keep its bytes in Object Storage.

## Architecture

`server/utils/object-storage.ts` provides an application-owned `ObjectStorage` interface over Hetzner's S3-compatible API:

| Method                                         | Purpose                                                          |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| `upload(input)`                                | Upload a `Uint8Array`, `Buffer`, or string from server code.     |
| `download(key)`                                | Download the complete object into memory as a `Uint8Array`.      |
| `remove(key)`                                  | Delete an object.                                                |
| `exists(key)`                                  | Check object existence without hiding non-404 errors.            |
| `getSignedDownloadUrl(key, expiresInSeconds?)` | Create a temporary read URL.                                     |
| `getSignedUploadUrl(input)`                    | Create a temporary PUT URL restricted to a key and content type. |

The storage is private by default. Signed URLs expire after 15 minutes unless the caller supplies another whole-number lifetime from 1 second through 7 days. Buffered downloads load the entire object into memory; use signed downloads for large files.

## 1. Create a private bucket

In [Hetzner Console](https://console.hetzner.com/):

1. Open your project and select **Object Storage**.
2. Select **Create Bucket**, choose a location, and give the bucket a globally unique name.
3. Set **Visibility** to **private**. Student submissions and assessment documents must never use a public bucket.
4. Generate S3 credentials for the project and save the secret key immediately. Hetzner does not show the secret key again.

Hetzner's official guides provide the current Console flow: [creating a bucket](https://docs.hetzner.com/storage/object-storage/getting-started/creating-a-bucket/), [generating S3 credentials](https://docs.hetzner.com/storage/object-storage/getting-started/generating-s3-credentials/), and [using S3-compatible libraries](https://docs.hetzner.com/storage/object-storage/getting-started/using-libraries/).

For a bucket in Falkenstein, the endpoint is `https://fsn1.your-objectstorage.com` and the region is `fsn1`. For another location, use its matching endpoint and region shown by Hetzner. Do not put the bucket name in the endpoint; the adapter uses the bucket as a virtual host.

## 2. Configure local development

Copy the example and edit the resulting untracked file:

```bash
cp .env.example .env
```

Set all five values in `.env`:

```dotenv
NUXT_OBJECT_STORAGE_ENDPOINT=https://fsn1.your-objectstorage.com
NUXT_OBJECT_STORAGE_REGION=fsn1
NUXT_OBJECT_STORAGE_BUCKET=your-real-bucket-name
NUXT_OBJECT_STORAGE_ACCESS_KEY_ID=your-real-access-key
NUXT_OBJECT_STORAGE_SECRET_ACCESS_KEY=your-real-secret-key
```

| Variable                                | Value                                       |
| --------------------------------------- | ------------------------------------------- |
| `NUXT_OBJECT_STORAGE_ENDPOINT`          | HTTPS endpoint for the bucket's location.   |
| `NUXT_OBJECT_STORAGE_REGION`            | Bucket location identifier, such as `fsn1`. |
| `NUXT_OBJECT_STORAGE_BUCKET`            | Exact globally unique bucket name.          |
| `NUXT_OBJECT_STORAGE_ACCESS_KEY_ID`     | S3 access key generated in Hetzner Console. |
| `NUXT_OBJECT_STORAGE_SECRET_ACCESS_KEY` | Matching S3 secret key.                     |

All five are required when a code path uses storage. Configuration is loaded lazily, so unrelated routes such as the health check still start without credentials. Invalid or blank values produce an error when storage is first used.

These variables map to private `runtimeConfig.objectStorage` fields. Never prefix them with `NUXT_PUBLIC_`, expose them in Vue components, or commit `.env`. Restart the development server or Docker Compose service after changing them.

## 3. Configure production

Production reads the same variables. Add their real values to `/opt/korekto/.env` through the GitHub Actions `ENV_FILE` secret, as described in [the deployment guide](deployment.md). `compose.yaml` passes all five values to the container; no volume or persistent disk is needed for application files.

Use separate buckets and credentials for development, testing, and production. Restrict credentials to the required access where the provider supports it, and rotate them without printing or logging their values.

## Server-side upload and download

Nuxt auto-imports the helpers inside `server/`. Generate keys on the server; never trust a client-supplied path.

```ts
const storage = useObjectStorage()
const key = createObjectKey(file.filename ?? 'submission', 'submissions/2026')

await storage.upload({
  key,
  body: file.data,
  contentType: file.type || 'application/octet-stream',
  contentLength: file.data.byteLength,
  metadata: { ownerid: studentId },
})
```

`createObjectKey()` creates a UUID-based key and preserves only a safe lowercase extension. A prefix such as `submissions/2026` must be a safe relative path. The adapter rejects absolute paths, traversal, empty path segments, backslashes, control characters, and URL delimiters.

After a successful upload, persist at least the object key, original display filename, media type, byte size, owner, and timestamps in application data. Do not persist a signed URL as though it were a permanent file location.

For a small server-side download:

```ts
const bytes = await useObjectStorage().download(submission.objectKey)
```

For large files, return a signed download URL only after authenticating the request and checking that the caller may access that specific object:

```ts
const downloadUrl = await useObjectStorage().getSignedDownloadUrl(submission.objectKey)
```

## Direct browser uploads

Use a signed PUT URL to avoid buffering large uploads in the Nuxt server. The server must authenticate the user, authorize the operation, validate the requested upload, and generate the key before signing:

```ts
const key = createObjectKey(fileName, 'submissions/2026')
const uploadUrl = await useObjectStorage().getSignedUploadUrl({
  key,
  contentType: 'application/pdf',
  expiresInSeconds: 300,
})

return { key, uploadUrl }
```

The browser must use PUT and the exact signed content type:

```ts
await fetch(uploadUrl, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/pdf' },
  body: file,
})
```

Configure bucket CORS to allow this PUT flow only from the application's trusted origins. After the upload, call an authenticated application endpoint to confirm and record it. A completed PUT is not proof that the content is safe or valid: enforce size limits, inspect the actual media type, scan untrusted files where required, and authorize every later download or deletion.

## Security and operational rules

- Treat object keys as private identifiers and signed URLs as temporary bearer credentials. Never log either signed URLs or storage secrets.
- Check object-level authorization before signing, downloading, deleting, or revealing metadata. A valid login alone is not sufficient.
- Keep buckets private. Do not add public-read ACLs or permanent public URLs.
- Do not let clients choose arbitrary keys, overwrite other objects, or select an unbounded signed-URL lifetime.
- Use buffered uploads only for bounded request sizes. Prefer signed direct uploads for large files.
- Delete application metadata and object bytes according to the product's retention and deletion policy. `remove()` does not delete database records.
- Unit tests must mock the S3 transport. Do not require real credentials or a live Hetzner bucket for the standard test suite.
