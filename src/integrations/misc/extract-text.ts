import * as path from "path"
// @ts-ignore-next-line
import pdf from "pdf-parse/lib/pdf-parse"
import mammoth from "mammoth"
import fs from "fs/promises"
import { isBinaryFile } from "isbinaryfile"

interface FileInfo {
	size: number
	type: string
	path: string
}

export type ReadingStrategy =
	| { type: "default" } // デフォルト戦略（閾値に基づく読み取り）
	| { type: "complete" } // 全体読み込み
	| { type: "byteRange"; start: number; end?: number } // バイト範囲指定
	| { type: "lineRange"; startLine: number; endLine?: number } // 行範囲指定

interface ExtractTextOptions {
	strategy?: ReadingStrategy
	includeMetadata?: boolean
}

interface ReadResult {
	content: string
	fileInfo?: FileInfo
	isTruncated: boolean
	appliedStrategy: ReadingStrategy
	remainingSize?: number
	metadata?: Record<string, any>
}

const SIZE_THRESHOLD = 100 * 1024 // 100KB in bytes

export async function extractTextFromFile(
	filePath: string,
	options: ExtractTextOptions = { strategy: { type: "default" } },
): Promise<ReadResult> {
	try {
		try {
			await fs.access(filePath)
		} catch (accessError: any) {
			if (accessError.code === "ENOENT") {
				throw new Error("File not found")
			} else if (accessError.code === "EACCES") {
				throw new Error("Permission denied")
			}
			throw accessError // Re-throw other access errors
		}

		// Get file stats
		const stats = await fs.stat(filePath)
		const fileSize = stats.size
		const fileInfo: FileInfo = {
			size: fileSize,
			type: path.extname(filePath).toLowerCase(),
			path: filePath,
		}

		// Set default strategy if not provided
		const strategy = options.strategy || { type: "default" }
		const fileExtension = path.extname(filePath).toLowerCase()
		let content: string
		let isTruncated = false

		// Check if file is binary
		const isBinary = await isBinaryFile(filePath).catch(() => false)
		if (isBinary && ![".pdf", ".docx", ".ipynb"].includes(fileExtension)) {
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
				if (strategy.type === "byteRange") {
					// バイト範囲の検証
					if (strategy.start < 0) {
						throw new Error("Start position must be non-negative")
					}
					if (strategy.end !== undefined && strategy.end < strategy.start) {
						throw new Error("End position must be greater than or equal to start position")
					}
					if (strategy.start >= fileSize) {
						throw new Error("Start position exceeds file size")
					}

					const end = strategy.end !== undefined ? Math.min(strategy.end, fileSize) : fileSize
					const length = end - strategy.start

					const handle = await fs.open(filePath)
					try {
						const buffer = new Uint8Array(length)
						await handle.read({ buffer, position: strategy.start, length })
						content = new TextDecoder().decode(buffer)
						isTruncated = false
					} finally {
						await handle.close()
					}
				} else if (strategy.type === "lineRange") {
					// 行範囲の検証
					if (strategy.startLine < 1) {
						throw new Error("Start line must be at least 1")
					}
					if (strategy.endLine !== undefined && strategy.endLine < strategy.startLine) {
						throw new Error("End line must be greater than or equal to start line")
					}

					const lines = (await fs.readFile(filePath, "utf8")).split("\n")
					const totalLines = lines.length

					if (strategy.startLine > totalLines) {
						throw new Error("Start line exceeds total lines in file")
					}

					const endLine = strategy.endLine !== undefined ? Math.min(strategy.endLine, totalLines) : totalLines
					content = lines.slice(strategy.startLine - 1, endLine).join("\n")
					isTruncated = false
				} else if (strategy.type === "complete" || fileSize <= SIZE_THRESHOLD) {
					// Read entire file for complete strategy or small files
					content = await fs.readFile(filePath, "utf8")
					isTruncated = false
				} else {
					// Default strategy: Read only first 100KB for large files
					const handle = await fs.open(filePath)
					try {
						const buffer = new Uint8Array(SIZE_THRESHOLD)
						await handle.read({ buffer, position: 0, length: SIZE_THRESHOLD })
						content = new TextDecoder().decode(buffer)
						isTruncated = true
					} finally {
						await handle.close()
					}
				}
		}

		return {
			content,
			fileInfo,
			isTruncated,
			appliedStrategy: strategy,
			...(isTruncated && { remainingSize: fileSize - SIZE_THRESHOLD }),
			...(options.includeMetadata && {
				metadata: {
					lastModified: stats.mtime,
					created: stats.birthtime,
					permissions: stats.mode,
				},
			}),
		}
	} catch (error: any) {
		if (error instanceof Error) {
			if (error.message === "File not found") {
				throw error // Re-throw "File not found" error
			} else if (error.message === "Permission denied") {
				throw new Error("Permission denied") // Replace with custom "Permission denied" error
			} else if (error.message === "Path is a directory") {
				throw new Error("Path is a directory") // Replace with custom "Path is a directory" error
			}
			throw error // Re-throw original error message without prefix
		}
		throw new Error("Failed to extract text from file: Unknown error")
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
