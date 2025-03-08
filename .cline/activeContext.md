# Active Context

## Current Work

### Tool Enhancement: read_file
1. Current Status
   - Tool is functional but has limitations with large files and lacks optimized context utilization
   - Current implementation in `src/core/Cline.ts` (tool handling) and `src/integrations/misc/extract-text.ts` (file reading)

2. Current Implementation Details
   - Supports reading text files, PDF, DOCX, and Jupyter Notebook files
   - Uses `isbinaryfile` library to detect binary files
   - Reads entire file content at once, regardless of size
   - No optimization for LLM context window consumption
   - No automatic strategy selection based on file type

3. Areas of Focus
   - Implement automatic reading strategy based on file size and type
   - Improve efficiency for large files using file size-based decision making
   - Enhance user experience by providing relevant file content quickly

4. Proposed Solution: Size-Based Reading Strategy

   - **Initial Check**: When `read_file` is called, check file size using `fs.stat()`.
   - **Size-Based Decision**:
     - If size <= 500KB: Return full file content
     - If size > 500KB: Read first 500KB and return with file info (path, type, total size)
   - **Automatic Strategy Decision**: Based on file size and type, determine reading approach:
     - Code files: `strategy="definitions"` (list code definitions)
     - Text files: `strategy="summary"` (generate summary)
     - Config files: `strategy="key"` (extract specific keys)
     - Unknown files: `strategy="full"` (read full content)
   - **Re-read with Strategy**: Cline re-executes `read_file` with determined strategy

5. Key Considerations
   - Efficient size-based file handling
   - Robust file type detection
   - Accurate strategy selection logic
   - Clear size-based thresholds and user feedback

## Recent Changes

### System Setup
1. Memory Bank Initialization
   - Created cline_docs directory
   - Initialized core documentation files:
     - productContext.md
     - systemPatterns.md
     - techContext.md
     - progress.md
     - activeContext.md (this file)

2. Documentation Structure
   - Project overview documented
   - System patterns established
   - Technical context detailed
   - Progress tracking initiated

## Next Steps

### Immediate Tasks
1. Tool Enhancement
   - ✓ Review current read_file implementation
   - Implement line counting functionality for large files
   - Develop file type detection enhancement
   - Create strategy selection logic
   - Implement automatic strategy application
   - Identify test coverage gaps
   - Plan test improvements

2. Implementation Plan
   - Modify `extractTextFromFile` to support line counting and partial reading
   - Extend Cline class handling for read_file to support strategy parameter
   - Create utility functions for file type detection and strategy selection
   - Implement efficient handling of large files

3. Test Development
   - Create new test file for read_file
   - Implement test cases for:
     - Normal operation
     - Error conditions
     - Edge cases
     - Performance scenarios

3. Documentation
   - Update tool documentation
   - Add test documentation
   - Improve error message documentation
   - Document performance considerations

### Future Considerations
1. Performance
   - Large File Processing Optimization
     - Consideration of streaming processing
     - Dynamic processing methods based on file size
     - Implementation of partial reading
   - Context Management Improvement
     - File content summarization functionality
     - Extraction of important sections
     - Selective reading based on user purpose
   - Resource Efficiency Enhancement
     - Memory usage optimization
     - Efficient use of context window

2. User Experience
   - Review error messages
   - Consider additional feedback
   - Evaluate auto-approval settings
   - Update user documentation
