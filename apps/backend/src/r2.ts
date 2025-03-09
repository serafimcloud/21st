import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3"

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.NEXT_PUBLIC_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
})

const BUCKET_NAME = "components-code"

export const isValidId = (id: string) => {
  return /^[a-zA-Z0-9-_]+$/.test(id)
}

export const saveBundledFilesToR2 = async (
  id: string,
  { html }: { html: string },
): Promise<{ htmlUrl: string }> => {
  if (!isValidId(id)) {
    throw new Error(
      "Invalid ID format. Only alphanumeric characters, hyphens, and underscores are allowed.",
    )
  }

  const baseKey = `bundled/${id}`

  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `${baseKey}.html`,
      Body: Buffer.from(html),
      ContentType: "text/html",
    }),
  )

  return {
    htmlUrl: `${process.env.NEXT_PUBLIC_CDN_URL}/${baseKey}.html`,
  }
}

export const getBundledPageFromR2 = async (
  id: string,
): Promise<string | null> => {
  if (!isValidId(id)) {
    return null
  }

  try {
    const key = `bundled/${id}.html`

    const response = await r2Client.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }),
    )

    if (!response.Body) {
      return null
    }

    return await response.Body.transformToString()
  } catch (error) {
    console.error("Error fetching from R2:", error)
    return null
  }
}

export const getStaticFileFromR2 = async (
  filename: string,
): Promise<{ content: string; contentType: string } | null> => {
  try {
    const key = `bundled/${filename}`

    const response = await r2Client.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }),
    )

    if (!response.Body) {
      return null
    }

    const content = await response.Body.transformToString()
    const contentType = filename.endsWith(".js")
      ? "application/javascript"
      : filename.endsWith(".css")
        ? "text/css"
        : "text/plain"

    return { content, contentType }
  } catch (error) {
    console.error("Error fetching static file from R2:", error)
    return null
  }
}
