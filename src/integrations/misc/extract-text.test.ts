import assert from 'assert';
import { extractTextFromFile } from './extract-text'; // Assuming extract-text.ts is in the same directory

describe('extract-text', () => {
  describe('read_file', () => {
    it('should read a normal-sized file correctly', async () => {
      const testFilePath = 'normal-file.txt';
      const testContent = 'This is a normal-sized text file.';
      await fs.writeFile(testFilePath, testContent, 'utf8');

      const result = await extractTextFromFile(testFilePath);

      assert.strictEqual(result.content, testContent);
      assert.strictEqual(result.isTruncated, false);

      await fs.unlink(testFilePath);
    });

    it('should read a large file partially', async () => {
      const testFilePath = 'large-file.txt';
      const largeContent = 'This is a large text file. '.repeat(100000); // Create a file larger than 500KB
      await fs.writeFile(testFilePath, largeContent, 'utf8');

      const result = await extractTextFromFile(testFilePath);

      assert.strictEqual(result.isTruncated, true);
      assert.strictEqual(result.content.length, 512000); // 500KB in bytes
      assert.strictEqual(result.content, largeContent.substring(0, 512000));

      await fs.unlink(testFilePath);
    });

    it('should return correct file info', async () => {
      const testFilePath = 'file-info-test.txt';
      const testContent = 'This is a test file for file info.';
      await fs.writeFile(testFilePath, testContent, 'utf8');
      const stats = await fs.stat(testFilePath);
      const fileSize = stats.size;
      const fileType = '.txt';
      const filePath = testFilePath;

      const result = await extractTextFromFile(testFilePath);

      assert.strictEqual(result.fileInfo?.size, fileSize);
      assert.strictEqual(result.fileInfo?.type, fileType);
      assert.strictEqual(result.fileInfo?.path, filePath);

      await fs.unlink(testFilePath);
    });
  });
});
import fs from 'fs/promises';
