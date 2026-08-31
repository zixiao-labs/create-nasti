// Exercise Clack's actual animated rendering even when the test runner pipes stdout.
delete process.env.CI
delete process.env.CONTINUOUS_INTEGRATION
process.env.TERM = 'xterm-256color'
Object.defineProperty(process.stdout, 'isTTY', { value: true })
Object.defineProperty(process.stdout, 'columns', { value: 120 })
