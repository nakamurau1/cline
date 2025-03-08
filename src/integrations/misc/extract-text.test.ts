import assert from "assert"
import { extractTextFromFile } from "./extract-text"
import fs from "fs/promises"

import * as os from "os"
import * as path from "path"

describe("extract-text", () => {
	let testDir: string

	beforeEach(async () => {
		// Create a unique temporary directory for each test run
		testDir = path.join(os.tmpdir(), `extract-text-test-${Date.now()}`)
		await fs.mkdir(testDir, { recursive: true })
	})

	afterEach(async () => {
		// Clean up the temporary directory after each test
		try {
			await fs.rm(testDir, { recursive: true, force: true })
		} catch (error) {
			console.error("Failed to clean up test directory:", error)
		}
	})

	describe("read_file", () => {
		it("should read a normal-sized file correctly", async () => {
			const testFilePath = path.join(testDir, "normal-file.txt")
			const testContent = "This is a normal-sized text file."
			await fs.writeFile(testFilePath, testContent, "utf8")

			const result = await extractTextFromFile(testFilePath)

			assert.strictEqual(result.content, testContent)
			assert.strictEqual(result.isTruncated, false)

			// Cleanup handled by afterEach
		})

		it("should read a large file partially", async () => {
			const testFilePath = path.join(testDir, "large-file.txt")
			const largeContent = "This is a large text file. ".repeat(20000) // Create a file larger than 100KB
			await fs.writeFile(testFilePath, largeContent, "utf8")

			const result = await extractTextFromFile(testFilePath)

			assert.strictEqual(result.isTruncated, true)
			assert.strictEqual(result.content.length, 102400) // 100KB in bytes
			assert.strictEqual(result.content, largeContent.substring(0, 102400))
		})

		it("should return correct file info", async () => {
			const testFilePath = path.join(testDir, "file-info-test.txt")
			const testContent = "This is a test file for file info."
			await fs.writeFile(testFilePath, testContent, "utf8")
			const stats = await fs.stat(testFilePath)
			const fileSize = stats.size
			const fileType = ".txt"
			const filePath = testFilePath

			const result = await extractTextFromFile(testFilePath)

			assert.strictEqual(result.fileInfo?.size, fileSize)
			assert.strictEqual(result.fileInfo?.type, fileType)
			assert.strictEqual(result.fileInfo?.path, filePath)
		})

		it("should handle file not found error", async () => {
			const testFilePath = path.join(testDir, "non-existent-file.txt")

			try {
				await extractTextFromFile(testFilePath)
				assert.fail("Expected file not found error to be thrown")
			} catch (error: any) {
				assert.strictEqual(error.message, "File not found")
			}
		})

		it("should handle file access denied error", async () => {
			const testFilePath = path.join(testDir, "permission-denied-file.txt")
			await fs.writeFile(testFilePath, "test content", "utf8")
			await fs.chmod(testFilePath, 0o000) // Revoke all permissions

			try {
				await extractTextFromFile(testFilePath)
				assert.fail("Expected file access denied error to be thrown")
			} catch (error: any) {
				assert.match(error.message, /permission-denied-file\.txt/)
			} finally {
				await fs.chmod(testFilePath, 0o777) // Restore permissions
			}
		})

		it("should handle invalid file path error", async () => {
			const testFilePath = "/invalid/file/path" // An invalid path

			try {
				await extractTextFromFile(testFilePath)
				assert.fail("Expected invalid file path error to be thrown")
			} catch (error: any) {
				assert.strictEqual(error.message, "File not found") // For invalid path, access() throws ENOENT
			}
		})

		it("should handle directory instead of file error", async () => {
			const testDirPath = path.join(testDir, "test-dir")
			// Check if directory already exists, if not create it
			try {
				await fs.access(testDirPath)
			} catch (error) {
				// Directory does not exist, create it
				await fs.mkdir(testDirPath)
			}

			try {
				await extractTextFromFile(testDirPath)
				assert.fail("Expected directory error to be thrown")
			} catch (error: any) {
				assert.strictEqual(error.message, "EISDIR: illegal operation on a directory, read")
			}
		})
	})

	describe("reading strategies", () => {
		describe("byte range strategy", () => {
			it("should read specified byte range of file", async () => {
				const testFilePath = path.join(testDir, "byte-range-test.txt")
				const content = "This is a test file for byte range reading."
				await fs.writeFile(testFilePath, content, "utf8")

				const result = await extractTextFromFile(testFilePath, {
					strategy: { type: "byteRange", start: 5, end: 15 },
				})

				assert.strictEqual(result.content, content.substring(5, 15))
				assert.strictEqual(result.isTruncated, false)
				assert.deepStrictEqual(result.appliedStrategy, { type: "byteRange", start: 5, end: 15 })
			})

			it("should read to end when end position is omitted", async () => {
				const testFilePath = path.join(testDir, "byte-range-to-end-test.txt")
				const content = "This is a test file for byte range reading."
				await fs.writeFile(testFilePath, content, "utf8")

				const result = await extractTextFromFile(testFilePath, {
					strategy: { type: "byteRange", start: 10 },
				})

				assert.strictEqual(result.content, content.substring(10))
				assert.strictEqual(result.isTruncated, false)
			})

			it("should handle end position exceeding file size", async () => {
				const testFilePath = path.join(testDir, "byte-range-exceed-test.txt")
				const content = "This is a test file."
				await fs.writeFile(testFilePath, content, "utf8")

				const result = await extractTextFromFile(testFilePath, {
					strategy: { type: "byteRange", start: 5, end: 1000 },
				})

				// 長さの異なるエンコーディングを考慮し、実際の内容を検証
				const expectedContent = content.substring(5)
				assert.strictEqual(result.content.length, expectedContent.length)
				assert.strictEqual(result.content, expectedContent)
				assert.strictEqual(result.isTruncated, false)
			})

			it("should throw error for negative start position", async () => {
				const testFilePath = path.join(testDir, "byte-range-negative-test.txt")
				const content = "Test file"
				await fs.writeFile(testFilePath, content, "utf8")

				await assert.rejects(
					async () => {
						await extractTextFromFile(testFilePath, {
							strategy: { type: "byteRange", start: -5 },
						})
					},
					{ message: "Start position must be non-negative" },
				)
			})

			it("should throw error when end is less than start", async () => {
				const testFilePath = path.join(testDir, "byte-range-invalid-range-test.txt")
				const content = "Test file"
				await fs.writeFile(testFilePath, content, "utf8")

				await assert.rejects(
					async () => {
						await extractTextFromFile(testFilePath, {
							strategy: { type: "byteRange", start: 10, end: 5 },
						})
					},
					{ message: "End position must be greater than or equal to start position" },
				)
			})

			it("should throw error when start position exceeds file size", async () => {
				const testFilePath = path.join(testDir, "byte-range-exceed-start-test.txt")
				const content = "Test file"
				await fs.writeFile(testFilePath, content, "utf8")

				await assert.rejects(
					async () => {
						await extractTextFromFile(testFilePath, {
							strategy: { type: "byteRange", start: 1000 },
						})
					},
					{ message: "Start position exceeds file size" },
				)
			})
		})

		it("should read entire large file with complete strategy", async () => {
			try {
				const testFilePath = path.join(testDir, "large-complete-file.txt")
				const largeContent = "This is a large text file. ".repeat(20000) // Create a file larger than 100KB

				// ファイルを書き込み、書き込みが完了するのを待つ
				await fs.writeFile(testFilePath, largeContent, "utf8")

				// ファイルが存在することを確認
				await fs.access(testFilePath)

				const result = await extractTextFromFile(testFilePath, {
					strategy: { type: "complete" },
				})

				assert.strictEqual(result.isTruncated, false)
				assert.strictEqual(result.content, largeContent)
				assert.deepStrictEqual(result.appliedStrategy, { type: "complete" })
				assert.strictEqual(result.remainingSize, undefined)
			} catch (error: any) {
				console.error("Test error:", error)
				throw error
			}
		})

		it("should use default strategy when no strategy specified", async () => {
			const testFilePath = path.join(testDir, "large-default-file.txt")
			const largeContent = "This is a large text file. ".repeat(20000)
			await fs.writeFile(testFilePath, largeContent, "utf8")

			const result = await extractTextFromFile(testFilePath)

			assert.strictEqual(result.isTruncated, true)
			assert.strictEqual(result.content.length, 102400) // 100KB
			assert.deepStrictEqual(result.appliedStrategy, { type: "default" })
			assert.ok(result.remainingSize && result.remainingSize > 0)
		})
	})

	describe("metadata options", () => {
		it("should include metadata when requested", async () => {
			const testFilePath = path.join(testDir, "metadata-test-file.txt")
			const testContent = "This is a test file for metadata."
			await fs.writeFile(testFilePath, testContent, "utf8")

			const result = await extractTextFromFile(testFilePath, {
				includeMetadata: true,
			})

			assert.ok(result.metadata)
			assert.ok(result.metadata.lastModified instanceof Date)
			assert.ok(result.metadata.created instanceof Date)
			assert.ok(typeof result.metadata.permissions === "number")
		})

		it("should not include metadata by default", async () => {
			const testFilePath = path.join(testDir, "no-metadata-test-file.txt")
			const testContent = "This is a test file without metadata."
			await fs.writeFile(testFilePath, testContent, "utf8")

			const result = await extractTextFromFile(testFilePath)

			assert.strictEqual(result.metadata, undefined)
		})
	})

	describe("strategy result information", () => {
		it("should return correct remaining size for truncated files", async () => {
			const testFilePath = path.join(testDir, "truncated-size-test.txt")
			const contentSize = 150 * 1024 // 150KB
			const content = "A".repeat(contentSize)
			await fs.writeFile(testFilePath, content, "utf8")

			const result = await extractTextFromFile(testFilePath)

			assert.strictEqual(result.isTruncated, true)
			assert.strictEqual(result.remainingSize, contentSize - 102400) // Total size - 100KB
			assert.deepStrictEqual(result.appliedStrategy, { type: "default" })
		})
	})
})
