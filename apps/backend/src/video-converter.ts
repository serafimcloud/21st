import { exec } from "child_process"
import fs from "fs/promises"
import path from "path"
import os from "os"

export function convertVideo(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = `ffmpeg -i "${inputPath}" -c:v libx264 -crf 23 -preset medium -an "${outputPath}"`
    exec(command, (error) => {
      if (error) {
        reject(error)
        return
      }
      resolve()
    })
  })
}

export async function handleVideoConversion(
  file: File,
): Promise<{ video: Buffer; filename: string }> {
  const tempDir = path.join(os.tmpdir(), "video-conversions")
  await fs.mkdir(tempDir, { recursive: true })

  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
  const tempInputPath = path.join(tempDir, sanitizedFilename)
  const tempOutputPath = path.join(
    tempDir,
    sanitizedFilename.replace(/\.[^/.]+$/, "") + `_converted_${Date.now()}.mp4`,
  )

  const bytes = await file.arrayBuffer()
  await fs.writeFile(tempInputPath, Buffer.from(bytes))

  await convertVideo(tempInputPath, tempOutputPath)
  const processedVideo = await fs.readFile(tempOutputPath)

  await Promise.all([fs.unlink(tempInputPath), fs.unlink(tempOutputPath)])

  return {
    video: processedVideo,
    filename: path.basename(tempOutputPath),
  }
}
