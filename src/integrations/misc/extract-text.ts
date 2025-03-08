import * as path from "path"
// @ts-ignore-next-line
import pdf from "pdf-parse/lib/pdf-parse"
import mammoth from "mammoth"
import fs from "fs/promises"
import { isBinaryFile } from "isbinaryfile"

interface FileInfo {
  size: number;
  type: string;
  path: string;
}

interface ReadResult {
  content: string;
  fileInfo?: FileInfo;
  isTruncated: boolean;
}

const SIZE_THRESHOLD = 500 * 1024; // 500KB in bytes

export async function extractTextFromFile(filePath: string): Promise<ReadResult> {
  try {
    await fs.access(filePath)

    // Get file stats
    const stats = await fs.stat(filePath)
    const fileSize = stats.size
    const fileInfo: FileInfo = {
      size: fileSize,
      type: path.extname(filePath).toLowerCase(),
      path: filePath
    }
    const fileExtension = path.extname(filePath).toLowerCase()
    let content: string
    let isTruncated = false

    // Check if file is binary
    const isBinary = await isBinaryFile(filePath).catch(() => false)
    if (isBinary && !['.pdf', '.docx', '.ipynb'].includes(fileExtension)) {
      throw new Error(`Cannot read text for file type: ${fileExtension}`)
    }

    switch (fileExtension) {
      case ".pdf":
        content = await extractTextFromPDF(filePath)
        break
      case ".docx":
        content = await extractTextFromDOCX(filePath)
        break
      case ".ipynb":
        content = await extractTextFromIPYNB(filePath)
        break
      default:
        if (fileSize > SIZE_THRESHOLD) {
          // Read only first 500KB for large files
          const handle = await fs.open(filePath)
          try {
            const buffer = new Uint8Array(SIZE_THRESHOLD)
            await handle.read({ buffer, position: 0, length: SIZE_THRESHOLD })
            content = new TextDecoder().decode(buffer)
            isTruncated = true
          } finally {
            await handle.close()
          }
        } else {
          content = await fs.readFile(filePath, "utf8")
        }
    }

    return {
      content,
      fileInfo,
      isTruncated
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to extract text from file: Unknown error')
  }
}

async function extractTextFromPDF(filePath: string): Promise<string> {
  const dataBuffer = await fs.readFile(filePath)
  const data = await pdf(dataBuffer)
  return data.text
}

async function extractTextFromDOCX(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath })
  return result.value
}

async function extractTextFromIPYNB(filePath: string): Promise<string> {
  const data = await fs.readFile(filePath, "utf8")
  const notebook = JSON.parse(data)
  let extractedText = ""

  for (const cell of notebook.cells) {
    if ((cell.cell_type === "markdown" || cell.cell_type === "code") && cell.source) {
      extractedText += cell.source.join("\n") + "\n"
    }
  }

  return extractedText
}
