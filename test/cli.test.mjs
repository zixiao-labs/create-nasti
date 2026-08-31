import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { chmod, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stripVTControlCharacters } from 'node:util'
import { setTimeout as delay } from 'node:timers/promises'
import test from 'node:test'

const root = fileURLToPath(new URL('..', import.meta.url))
const cli = join(root, 'dist/index.js')
// --import is an ESM specifier: a bare Windows drive path is parsed as a URL scheme.
const terminalPreload = new URL('./fixtures/terminal.mjs', import.meta.url).href
const templates = ['react', 'react-tanstack', 'vue', 'electron-react']
const fixture = await readFile(new URL('./fixtures/package-manager.cjs', import.meta.url), 'utf8')

async function workspace(t) {
  const dir = await mkdtemp(join(tmpdir(), 'create-nasti-test-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  return dir
}

function startCli(t, cwd, args, env = {}, terminal = false) {
  const child = spawn(process.execPath, [
    ...(terminal ? ['--import', terminalPreload] : []),
    cli, ...args,
  ], {
    cwd,
    env: { ...process.env, CI: 'true', NO_COLOR: '1', ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  child.stdout.setEncoding('utf8').on('data', (chunk) => { output += chunk })
  child.stderr.setEncoding('utf8').on('data', (chunk) => { output += chunk })
  const completed = new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('close', (code, signal) => resolve({ code, signal, output: stripVTControlCharacters(output) }))
  })
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
    await completed
  })
  return { child, completed, output: () => stripVTControlCharacters(output) }
}

async function fakeManager(cwd, pm) {
  const bin = join(cwd, 'fake-bin')
  await mkdir(bin, { recursive: true })
  const script = join(bin, `${pm}.cjs`)
  await writeFile(script, fixture)
  if (process.platform === 'win32') {
    await writeFile(join(bin, `${pm}.cmd`), `@"${process.execPath}" "%~dp0${pm}.cjs" %*\r\n`)
  } else {
    const executable = join(bin, pm)
    await writeFile(executable, `#!${process.execPath}\n${fixture}`)
    await chmod(executable, 0o755)
  }
  return {
    PATH: `${bin}${delimiter}${process.env.PATH ?? ''}`,
    MOCK_PM_STATE: join(cwd, 'manager-state.json'),
  }
}

async function waitFor(check, message) {
  const deadline = Date.now() + 10_000
  while (Date.now() < deadline) {
    if (await check()) return
    await delay(25)
  }
  assert.fail(message)
}

for (const template of templates) {
  test(`scaffolds ${template} with the current Nasti baseline`, { timeout: 15_000 }, async (t) => {
    const cwd = await workspace(t)
    const result = await startCli(t, cwd, ['my-app', '-t', template, '--no-install', '--no-git', '--pm', 'npm']).completed
    assert.equal(result.code, 0, result.output)
    const project = join(cwd, 'my-app')
    const pkg = JSON.parse(await readFile(join(project, 'package.json'), 'utf8'))
    assert.equal(pkg.name, 'my-app')
    assert.equal(pkg.devDependencies['@nasti-toolchain/nasti'], '^2.5.2')
    assert.equal(pkg.engines.node, '^20.19.0 || >=22.12.0')
    assert.match(await readFile(join(project, 'index.html'), 'utf8'), /<title>my-app<\/title>/)
    assert.match(await readFile(join(project, '.gitignore'), 'utf8'), /node_modules/)
    await assert.rejects(readFile(join(project, '_gitignore')), { code: 'ENOENT' })
    assert.match(result.output, /npm install/)
    assert.match(result.output, /npm run dev/)
    if (template === 'electron-react') {
      assert.equal(pkg.main, 'dist/main.cjs')
      assert.equal(pkg.scripts.dev, 'nasti electron')
      assert.equal(pkg.scripts.build, 'nasti electron-build')
      assert.equal(pkg.scripts['dev:renderer'], 'nasti dev')
      assert.equal(pkg.scripts.preview, 'nasti preview --outDir dist/renderer')
    } else {
      assert.equal(pkg.scripts['dev:bundle'], 'nasti dev --bundle')
    }
    if (template === 'vue') {
      assert.equal(pkg.dependencies.vue, pkg.devDependencies['@vue/compiler-sfc'])
      assert.match(pkg.dependencies.vue, /^\^3\.5\./)
    }
  })
}

for (const pm of ['npm', 'pnpm', 'yarn', 'bun']) {
  test(`installs with ${pm} and runs in the generated directory`, { timeout: 15_000 }, async (t) => {
    const cwd = await workspace(t)
    const env = await fakeManager(cwd, pm)
    const result = await startCli(t, cwd, ['my-app', '-t', 'react', '--install', '--no-git', '--pm', pm], env).completed
    assert.equal(result.code, 0, result.output)
    assert.match(result.output, new RegExp(`Installed dependencies with ${pm}`))
    assert.doesNotMatch(result.output, new RegExp(`${pm} install`))
    const state = JSON.parse(await readFile(env.MOCK_PM_STATE, 'utf8'))
    assert.deepEqual(state.args, ['install'])
    // macOS may resolve /var to /private/var for a child's cwd.
    assert.equal(await realpath(state.cwd), await realpath(join(cwd, 'my-app')))
  })
}

test('terminal preload starts successfully with a file URL', { timeout: 15_000 }, async (t) => {
  const cwd = await workspace(t)
  const result = await startCli(t, cwd, ['--help'], {}, true).completed
  assert.equal(result.code, 0, result.output)
  assert.match(result.output, /Usage/)
})

test('spinner renders multiple frames while installation is still running', { timeout: 15_000 }, async (t) => {
  const cwd = await workspace(t)
  const env = await fakeManager(cwd, 'pnpm')
  const running = startCli(t, cwd, ['my-app', '-t', 'vue', '--install', '--no-git'], {
    ...env,
    npm_config_user_agent: 'pnpm/11.24.0 npm/? node/v24.11.1',
    MOCK_PM_DELAY: '2000',
  }, true)
  await waitFor(() => {
    const diagnostic = `CLI exited before the spinner animated:\n${running.output()}`
    assert.equal(running.child.exitCode, null, diagnostic)
    assert.equal(running.child.signalCode, null, diagnostic)
    return (running.output().match(/Installing dependencies with pnpm/g) ?? []).length >= 3
  }, 'The spinner must animate before the package manager exits')
  assert.equal(running.child.exitCode, null)
  assert.doesNotMatch(running.output(), /Installed dependencies with/)
  const result = await running.completed
  assert.equal(result.code, 0, result.output)
  assert.match(result.output, /Installed dependencies with pnpm/)
  assert.doesNotMatch(result.output, /pnpm install/)
})

test('CI reports installation progress without repeatedly printing animation frames', { timeout: 15_000 }, async (t) => {
  const cwd = await workspace(t)
  const env = await fakeManager(cwd, 'npm')
  const result = await startCli(t, cwd, ['my-app', '-t', 'react', '--install', '--no-git', '--pm', 'npm'], {
    ...env, MOCK_PM_DELAY: '500',
  }).completed
  assert.equal(result.code, 0, result.output)
  assert.equal((result.output.match(/Installing dependencies with npm/g) ?? []).length, 1)
  assert.match(result.output, /Installed dependencies with npm/)
})

for (const stream of ['STDOUT', 'STDERR']) {
  test(`failed installs include ${stream.toLowerCase()} diagnostics and manual next steps`, { timeout: 15_000 }, async (t) => {
    const cwd = await workspace(t)
    const env = await fakeManager(cwd, 'pnpm')
    const result = await startCli(t, cwd, ['my-app', '-t', 'react', '--install', '--no-git', '--pm', 'pnpm'], {
      ...env,
      MOCK_PM_EXIT_CODE: '1',
      [`MOCK_PM_${stream}`]: 'ERR_TEST_INSTALL: registry unavailable',
    }).completed
    assert.equal(result.code, 0, result.output)
    assert.match(result.output, /Could not install dependencies/)
    assert.match(result.output, /ERR_TEST_INSTALL: registry unavailable/)
    assert.match(result.output, /pnpm install/)
    assert.doesNotMatch(result.output, /Installed dependencies with/)
  })
}

test('missing package-manager executable reports a useful error', { timeout: 15_000 }, async (t) => {
  const cwd = await workspace(t)
  const bin = join(cwd, 'empty-bin')
  await mkdir(bin)
  const result = await startCli(t, cwd, ['my-app', '-t', 'react', '--install', '--no-git', '--pm', 'pnpm'], {
    PATH: bin,
  }).completed
  assert.equal(result.code, 0, result.output)
  assert.match(result.output, /Could not install dependencies/)
  assert.match(result.output, process.platform === 'win32' ? /exited with code|ENOENT/ : /ENOENT/)
  assert.match(result.output, /pnpm install/)
})

test('large install logs do not overflow a child-process output buffer', { timeout: 15_000 }, async (t) => {
  const cwd = await workspace(t)
  const env = await fakeManager(cwd, 'npm')
  const result = await startCli(t, cwd, ['my-app', '-t', 'react', '--install', '--no-git', '--pm', 'npm'], {
    ...env, MOCK_PM_LARGE_OUTPUT: '1',
  }).completed
  assert.equal(result.code, 0, result.output)
  assert.match(result.output, /Installed dependencies with npm/)
  assert.ok(result.output.length < 10_000)
})

test('SIGINT cancels installation without printing successful next steps', {
  timeout: 15_000,
  skip: process.platform === 'win32' && 'Windows does not deliver POSIX SIGINT to child processes',
}, async (t) => {
  const cwd = await workspace(t)
  const env = await fakeManager(cwd, 'npm')
  const running = startCli(t, cwd, ['my-app', '-t', 'react', '--install', '--no-git', '--pm', 'npm'], {
    ...env, MOCK_PM_DELAY: '10000',
  })
  await waitFor(async () => {
    try { return Boolean(JSON.parse(await readFile(env.MOCK_PM_STATE, 'utf8')).pid) } catch { return false }
  }, 'Package manager did not start')
  running.child.kill('SIGINT')
  const result = await running.completed
  assert.equal(result.code, 130, result.output)
  assert.match(result.output, /Dependency installation cancelled/)
  assert.doesNotMatch(result.output, /Next steps|Happy hacking|Installed dependencies with/)
  assert.equal(JSON.parse(await readFile(env.MOCK_PM_STATE, 'utf8')).cancelled, true)
})

test('invalid package managers are rejected before scaffolding', { timeout: 15_000 }, async (t) => {
  const cwd = await workspace(t)
  const result = await startCli(t, cwd, ['my-app', '-t', 'react', '--install', '--no-git', '--pm', 'invalid-pm']).completed
  assert.equal(result.code, 1, result.output)
  assert.match(result.output, /Unknown package manager/)
  await assert.rejects(readFile(join(cwd, 'my-app/package.json')), { code: 'ENOENT' })
})
