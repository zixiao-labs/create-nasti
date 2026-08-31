import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { access, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { stripVTControlCharacters } from 'node:util'

const root = fileURLToPath(new URL('..', import.meta.url))
const workspace = await mkdtemp(join(tmpdir(), 'create-nasti-smoke-'))
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const env = { ...process.env, CI: 'true', ELECTRON_SKIP_BINARY_DOWNLOAD: '1', npm_config_loglevel: 'warn' }

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd, env, stdio: 'inherit', shell: process.platform === 'win32' && command === npm,
    })
    child.once('error', reject)
    child.once('close', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited with ${code}`)))
  })
}

async function checkDev(project, template) {
  const nasti = join(project, 'node_modules/@nasti-toolchain/nasti/bin/nasti.js')
  const server = spawn(process.execPath, [nasti, 'dev', '--port', '0'], {
    cwd: project, env, stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  let spawnError
  server.stdout.setEncoding('utf8').on('data', (chunk) => { output += chunk })
  server.stderr.setEncoding('utf8').on('data', (chunk) => { output += chunk })
  server.once('error', (error) => { spawnError = error })
  const closed = new Promise((resolve) => server.once('close', resolve))
  try {
    const deadline = Date.now() + 30_000
    let origin
    while (Date.now() < deadline) {
      if (spawnError) throw spawnError
      origin = stripVTControlCharacters(output).match(/http:\/\/localhost:(\d+)/)?.[0]
      if (origin) break
      if (server.exitCode !== null) throw new Error(`Dev server exited:\n${output}`)
      await delay(100)
    }
    assert.ok(origin, `Dev server did not become ready:\n${output}`)
    const response = await fetch(origin, { signal: AbortSignal.timeout(10_000) })
    assert.equal(response.status, 200)
    assert.match(await response.text(), /<div id="app"><\/div>/)
    const entry = template === 'vue' ? '/src/main.ts' : '/src/main.tsx'
    const module = await fetch(new URL(entry, origin), { signal: AbortSignal.timeout(10_000) })
    assert.equal(module.status, 200)
    assert.match(await module.text(), template === 'vue' ? /createApp/ : /createRoot/)
    const component = template === 'vue' ? '/src/App.vue' : template === 'react-tanstack' ? '/src/routes/index.tsx' : '/src/App.tsx'
    const transformed = await fetch(new URL(component, origin), { signal: AbortSignal.timeout(10_000) })
    assert.equal(transformed.status, 200)
    assert.ok((await transformed.text()).length > 0)
    console.log(`Dev entry and component verified: ${template}`)
  } finally {
    server.kill('SIGTERM')
    const forceKill = setTimeout(() => server.kill('SIGKILL'), 5_000)
    await closed
    clearTimeout(forceKill)
  }
}

try {
  for (const template of ['react', 'react-tanstack', 'vue', 'electron-react']) {
    const project = join(workspace, template)
    console.log(`\nVerifying ${template}`)
    await run(process.execPath, [join(root, 'dist/index.js'), template, '-t', template, '--install', '--no-git', '--pm', 'npm'], workspace)
    await access(join(project, 'node_modules/@nasti-toolchain/nasti/bin/nasti.js'))
    await run(npm, ['run', 'build'], project)
    await run(process.execPath, [join(project, 'node_modules/typescript/bin/tsc'), '--noEmit'], project)
    const html = template === 'electron-react' ? 'dist/renderer/index.html' : 'dist/index.html'
    assert.match(await readFile(join(project, html), 'utf8'), /<script[^>]*src=/)
    if (template === 'electron-react') {
      await access(join(project, 'dist/main.cjs'))
      await access(join(project, 'dist/preload.cjs'))
    }
    await checkDev(project, template)
  }
  console.log('\nAll four templates passed installation, build, typecheck and dev smoke tests.')
} finally {
  // Only remove this test's own uniquely allocated workspace.
  await rm(workspace, { recursive: true, force: true })
}
