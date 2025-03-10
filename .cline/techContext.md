# Technical Context

## Technologies Used

### Core Technologies
1. TypeScript/JavaScript
   - Primary development language
   - Strong type system for reliability
   - Modern ECMAScript features

2. VS Code Extension API
   - Extension manifest (package.json)
   - Extension activation events
   - Webview API
   - Terminal API
   - Workspace API

3. Node.js
   - Runtime environment
   - File system operations
   - Process management
   - Package management (npm)

### AI Integration
1. API Providers
   - OpenRouter
   - Anthropic (Claude)
   - OpenAI
   - Google Gemini
   - AWS Bedrock
   - Azure
   - GCP Vertex
   - Local models (LM Studio/Ollama)

2. Model Context Protocol (MCP)
   - Custom tool creation
   - Server-client communication
   - Resource management

### Development Tools
1. Build Tools
   - esbuild for bundling
   - TypeScript compiler
   - ESLint for code quality
   - Prettier for formatting

2. Testing Framework
   - Mocha for test running
   - Should.js for assertions
   - VS Code test utilities

3. Version Control
   - Git
   - git-lfs for large files
   - GitHub Actions for CI/CD

## Development Setup

### Requirements
1. Development Environment
   - Node.js (version specified in .nvmrc)
   - VS Code
   - Git with LFS support

2. Extension Dependencies
   - esbuild problem matchers
   - Required VS Code version

### Build Process
1. Development Build
   ```bash
   npm run install:all  # Install dependencies
   npm run compile     # Compile TypeScript
   npm run watch      # Watch for changes
   ```

2. Production Build
   ```bash
   npm run compile
   npm run package    # Create VSIX
   ```

### Testing Setup
1. Test Environment
   - VS Code Extension Test Runner
   - Temporary workspace creation
   - Mock API responses

2. Test Categories
   - Unit tests
   - Integration tests
   - End-to-end tests

## Technical Constraints

### VS Code Extension Limitations
1. Extension Host
   - Sandbox environment
   - Limited API access
   - Resource constraints

2. Performance Considerations
   - Context window size limits
   - API rate limits
   - File system operation overhead

### Security Boundaries
1. File Access
   - Workspace-scoped operations
   - .clineignore restrictions
   - Safe file handling

2. Command Execution
   - User approval required
   - Sandboxed terminal
   - Process monitoring

3. Browser Integration
   - Headless mode only
   - Limited interaction scope
   - Screenshot/console access

### API Provider Constraints
1. Rate Limits
   - Provider-specific limits
   - Retry mechanisms
   - Fallback options

2. Model Capabilities
   - Context window sizes
   - Token limitations
   - Cost considerations
