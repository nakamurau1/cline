import assert from "assert"
import { extractTextFromFile } from "./extract-text" // Assuming extract-text.ts is in the same directory
import fs from "fs/promises"

describe("extract-text", () => {
	describe("read_file", () => {
		it("should read a normal-sized file correctly", async () => {
			const testFilePath = "normal-file.txt"
			const testContent = "This is a normal-sized text file."
			await fs.writeFile(testFilePath, testContent, "utf8")

			const result = await extractTextFromFile(testFilePath)

			assert.strictEqual(result.content, testContent)
			assert.strictEqual(result.isTruncated, false)

			await fs.unlink(testFilePath)
		})

		it("should read a large file partially", async () => {
			const testFilePath = "large-file.txt"
			const largeContent = "This is a large text file. ".repeat(100000) // Create a file larger than 500KB
			await fs.writeFile(testFilePath, largeContent, "utf8")

			const result = await extractTextFromFile(testFilePath)

			assert.strictEqual(result.isTruncated, true)
			assert.strictEqual(result.content.length, 512000) // 500KB in bytes
			assert.strictEqual(result.content, largeContent.substring(0, 512000))

			await fs.unlink(testFilePath)
		})

		it("should return correct file info", async () => {
			const testFilePath = "file-info-test.txt"
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

			await fs.unlink(testFilePath)
		})

		it("should handle file not found error", async () => {
			const testFilePath = "non-existent-file.txt"

			try {
				await extractTextFromFile(testFilePath)
				assert.fail("Expected file not found error to be thrown");
			} catch (error: any) {
				assert.strictEqual(error.message, "File not found");
			}
		})

		it("should handle file access denied error", async () => {
			const testFilePath = "permission-denied-file.txt";
			await fs.writeFile(testFilePath, "test content", "utf8");
			await fs.chmod(testFilePath, 0o000); // Revoke all permissions

			try {
				await extractTextFromFile(testFilePath);
				assert.fail("Expected file access denied error to be thrown");
			} catch (error: any) {
				assert.match(error.message, /permission-denied-file\.txt/);
			} finally {
				await fs.chmod(testFilePath, 0o777); // Restore permissions
				await fs.unlink(testFilePath);
			}
		})

		it("should handle invalid file path error", async () => {
			const testFilePath = "/invalid/file/path" // An invalid path

			try {
				await extractTextFromFile(testFilePath)
				assert.fail("Expected invalid file path error to be thrown")
			} catch (error: any) {
				assert.strictEqual(error.message, "File not found"); // For invalid path, access() throws ENOENT
			}
		})

		it("should handle directory instead of file error", async () => {
			const testDirPath = "test-dir"
			// Check if directory already exists, if not create it
			try {
				await fs.access(testDirPath);
			} catch (error) {
				// Directory does not exist, create it
				await fs.mkdir(testDirPath);
			}

			try {
				await extractTextFromFile(testDirPath)
				assert.fail("Expected directory error to be thrown")
			} catch (error: any) {
				assert.strictEqual(error.message, 'EISDIR: illegal operation on a directory, read');
			} finally {
				await fs.rmdir(testDirPath)
			}
		})
	})
})
