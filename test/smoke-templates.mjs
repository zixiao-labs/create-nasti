import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { access, mkdtemp, readFile, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
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

async function checkServer(project, template, command = 'dev') {
  const isStart = template.endsWith('-start')
  // Nasti preview prints the configured port, not the assigned port when it is 0.
  const listener = createServer()
  await new Promise((resolve, reject) => {
    listener.once('error', reject)
    listener.listen(0, '127.0.0.1', resolve)
  })
  const port = listener.address().port
  await new Promise((resolve, reject) => listener.close((error) => error ? reject(error) : resolve()))
  const nasti = join(project, 'node_modules/@nasti-toolchain/nasti/bin/nasti.js')
  const server = spawn(process.execPath, [nasti, command, '--port', String(port), '--host', '127.0.0.1'], {
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
      origin = stripVTControlCharacters(output).match(/http:\/\/(?:localhost|127\.0\.0\.1):(\d+)/)?.[0]
      if (origin) break
      if (server.exitCode !== null) throw new Error(`${command} server exited:\n${output}`)
      await delay(100)
    }
    assert.ok(origin, `${command} server did not become ready:\n${output}`)
    const response = await fetch(origin, { signal: AbortSignal.timeout(10_000) })
    assert.equal(response.status, 200)
    const html = await response.text()
    if (isStart) {
      assert.match(html, /Hello from the server!/)
      assert.match(html, /count is/)
      const about = await fetch(new URL('/about', origin), { signal: AbortSignal.timeout(10_000) })
      assert.equal(about.status, 200)
      assert.match(await about.text(), /<h1[^>]*>About<\/h1>/)
      for (const path of ['/server/server.mjs', '/src/router.tsx']) {
        const privateFile = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(10_000) })
        assert.equal(privateFile.status, 404, `${command} must not serve ${path}`)
      }
      const asset = html.match(/(?:src|href)="([^"]*\/assets\/[^"]+\.(?:js|css))"/)?.[1]
      assert.ok(asset, `SSR response must reference a client asset:\n${html}`)
      const clientAsset = await fetch(new URL(asset, origin), { signal: AbortSignal.timeout(10_000) })
      assert.equal(clientAsset.status, 200)
      console.log(`${command} SSR, server-function loader, routes and client assets verified: ${template}`)
      return
    }
    assert.match(html, /<div id="app"><\/div>/)
    const entry = template === 'vue' ? '/src/main.ts' : '/src/main.tsx'
    const module = await fetch(new URL(entry, origin), { signal: AbortSignal.timeout(10_000) })
    assert.equal(module.status, 200)
    assert.match(await module.text(), template === 'vue' ? /createApp/ : template === 'solid' ? /render/ : /createRoot/)
    const component = template === 'vue' ? '/src/App.vue' : template === 'react-tanstack' ? '/src/routes/index.lazy.tsx' : '/src/App.tsx'
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
  for (const template of ['react', 'react-tanstack', 'vue', 'solid', 'react-start', 'solid-start', 'electron-react']) {
    const project = join(workspace, template)
    console.log(`\nVerifying ${template}`)
    await run(process.execPath, [join(root, 'dist/index.js'), template, '-t', template, '--install', '--no-git', '--pm', 'npm'], workspace)
    await access(join(project, 'node_modules/@nasti-toolchain/nasti/bin/nasti.js'))
    await run(npm, ['run', 'build'], project)
    await run(process.execPath, [join(project, 'node_modules/typescript/bin/tsc'), '--noEmit'], project)
    if (template.endsWith('-start')) {
      await access(join(project, 'dist/server/server.mjs'))
      await access(join(project, 'dist/client'))
      await checkServer(project, template, 'preview')
    } else {
      const html = template === 'electron-react' ? 'dist/renderer/index.html' : 'dist/index.html'
      assert.match(await readFile(join(project, html), 'utf8'), /<script[^>]*src=/)
    }
    if (template === 'electron-react') {
      await access(join(project, 'dist/main.cjs'))
      await access(join(project, 'dist/preload.cjs'))
    }
    await checkServer(project, template)
  }
  console.log('\nAll seven templates passed installation, build, typecheck and dev smoke tests; Start SSR preview passed.')
} finally {
  // Only remove this test's own uniquely allocated workspace.
  await rm(workspace, { recursive: true, force: true })
}
