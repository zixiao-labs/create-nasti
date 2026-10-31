// Test the CLI's template engine guard without requiring several Node binaries.
Object.defineProperty(process.versions, 'node', { value: process.env.MOCK_NODE_VERSION })
