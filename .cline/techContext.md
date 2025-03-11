# Technical Context: Cline VSCode Extension

## Technologies Used

- **Programming Languages:**
    - TypeScript: Primary language for the extension and webview UI.
    - JavaScript: Used in build scripts and potentially some legacy code.
- **UI Framework:**
    - React: For building the webview UI.
- **VSCode Extension API:**
    - For editor integration, file system access, commands, webviews, and state management.
- **MCP SDK:**
    - `@modelcontextprotocol/sdk`: For creating and managing MCP servers and tools.
- **Bundler/Compiler:**
    - esbuild: For fast TypeScript compilation and bundling.
    - Vite: For webview UI development and bundling.
- **Testing:**
    - Jest: JavaScript testing framework.
- **Linting/Formatting:**
    - ESLint: For code linting and enforcing code quality.
    - Prettier: For code formatting and consistency.
- **Version Control:**
    - Git: For source code management and checkpoint system.
- **Other Libraries:**
    - Puppeteer: For browser automation and testing.
    - axios: For making HTTP requests.
    - p-wait-for: For asynchronous waiting.
    - and many other npm dependencies listed in `package.json` files.

## Development Setup

1. **VSCode:**  Required for developing and running the extension.
2. **Node.js and npm:**  Required for building and running the extension and webview UI.
3. **Git:**  Required for version control and checkpoint system.
4. **npm install:** Run `npm install` in the root directory and `webview-ui` directory to install dependencies.
5. **esbuild problem matchers extension:** Recommended for better error reporting during build.

## Technical Constraints

- **VSCode Extension API Limitations:**  Limited by the capabilities and constraints of the VSCode Extension API.
- **Asynchronous Operations:**  Extension development heavily relies on asynchronous operations and promises.
- **State Management Complexity:**  Managing state across core extension and webview requires careful coordination and synchronization.
- **Security:**  Handling user code and executing commands requires careful security considerations.
- **Performance:**  Balancing performance and responsiveness in a VSCode extension environment.
- **Context Window Limits:**  API providers have context window limits, requiring efficient context management and truncation strategies.

## Dependencies

- **npm dependencies:**  Refer to `package.json` files in the root directory and `webview-ui` directory for a complete list of dependencies.
- **VSCode Extension API:**  Implicit dependency on VSCode and its extension API.
- **MCP Servers (optional):**  For extended functionality through custom tools.
