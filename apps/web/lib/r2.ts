"use server"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.resolve(process.cwd(), ".env") })

if (
  !process.env.R2_ACCESS_KEY_ID ||
  !process.env.R2_SECRET_ACCESS_KEY ||
  !process.env.NEXT_PUBLIC_R2_ENDPOINT
) {
  throw new Error(
    "R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and NEXT_PUBLIC_R2_ENDPOINT must be set",
  )
}

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.NEXT_PUBLIC_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
})

export const uploadToR2 = async ({
  file,
  fileKey,
  bucketName,
  contentType = "text/plain",
}: {
  file: {
    name: string
    type: string
    textContent?: string
    encodedContent?: string
  }
  fileKey: string
  bucketName: string
  contentType?: string
}): Promise<string> => {
  try {
    if (!file.textContent && !file.encodedContent) {
      throw new Error("textContent or encodedContent must be provided")
    }

    const content = file.textContent
      ? file.textContent
      : Buffer.from(file.encodedContent!, "base64")

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: content,
      ContentType: contentType,
    })

    await r2Client.send(command)

    return `${process.env.NEXT_PUBLIC_CDN_URL}/${fileKey}`
  } catch (error) {
    console.error("Error uploading to R2:", error)
    throw error
  }
}

export const generatePresignedUrl = async ({
  fileKey,
  bucketName,
  contentType = "text/plain",
  expiresIn = 3600, // URL expires in 1 hour by default
}: {
  fileKey: string
  bucketName: string
  contentType?: string
  expiresIn?: number
}): Promise<string> => {
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ContentType: contentType,
    })

    const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn })
    return presignedUrl
  } catch (error) {
    console.error("Error generating presigned URL:", error)
    throw error
  }
}
