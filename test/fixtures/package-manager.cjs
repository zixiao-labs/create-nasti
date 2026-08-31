const { writeFileSync } = require('node:fs')

writeFileSync(process.env.MOCK_PM_STATE, JSON.stringify({
  args: process.argv.slice(2),
  cwd: process.cwd(),
  pid: process.pid,
}))

process.on('SIGTERM', () => {
  writeFileSync(process.env.MOCK_PM_STATE, JSON.stringify({ cancelled: true }))
  process.exit(143)
})

setTimeout(() => {
  if (process.env.MOCK_PM_LARGE_OUTPUT) process.stdout.write('x'.repeat(2 * 1024 * 1024))
  if (process.env.MOCK_PM_STDOUT) console.log(process.env.MOCK_PM_STDOUT)
  if (process.env.MOCK_PM_STDERR) console.error(process.env.MOCK_PM_STDERR)
  process.exitCode = Number(process.env.MOCK_PM_EXIT_CODE ?? 0)
}, Number(process.env.MOCK_PM_DELAY ?? 10))
