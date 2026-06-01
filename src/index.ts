import * as p from '@clack/prompts'
import pc from 'picocolors'
import mri from 'mri'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

type TemplateId = 'react-tanstack' | 'react' | 'vue' | 'electron-react'
type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

const TEMPLATES: { id: TemplateId; label: string; hint: string }[] = [
  { id: 'react-tanstack', label: 'React + TanStack Router', hint: 'file-based routing, build-time auto code-splitting' },
  { id: 'react', label: 'React', hint: 'minimal single-page app' },
  { id: 'vue', label: 'Vue 3', hint: 'single-file components' },
  { id: 'electron-react', label: 'Electron + React', hint: 'Electron 41+ main / preload + React renderer' },
]

// Files shipped under template-safe names get renamed on scaffold. `.gitignore`
// must ship as `_gitignore` because npm strips a literal `.gitignore` from a
// published package.
const RENAME: Record<string, string> = {
  _gitignore: '.gitignore',
  _npmrc: '.npmrc',
}

const HELP = `
${pc.bold('create-nasti')} — scaffold a new ${pc.cyan('Nasti')} project

${pc.bold('Usage')}
  npm create nasti@latest ${pc.dim('[dir] [options]')}

${pc.bold('Options')}
  -t, --template <name>   ${pc.dim('react-tanstack | react | vue | electron-react')}
      --pm <name>         ${pc.dim('npm | pnpm | yarn | bun  (default: auto-detect)')}
      --install           ${pc.dim('install dependencies without asking')}
      --no-install        ${pc.dim('skip installing dependencies')}
      --git               ${pc.dim('run `git init` without asking')}
      --no-git            ${pc.dim('skip git init')}
      --overwrite         ${pc.dim('overwrite the target directory if non-empty')}
  -h, --help              ${pc.dim('show this help')}
`

function detectPm(): PackageManager {
  const ua = process.env.npm_config_user_agent ?? ''
  if (ua.startsWith('pnpm')) return 'pnpm'
  if (ua.startsWith('yarn')) return 'yarn'
  if (ua.startsWith('bun')) return 'bun'
  return 'npm'
}

const runScript = (pm: PackageManager, script: string): string =>
  pm === 'npm' ? `npm run ${script}` : `${pm} ${script}`

function isEmptyDir(dir: string): boolean {
  if (!existsSync(dir)) return true
  const files = readdirSync(dir)
  return files.length === 0 || (files.length === 1 && files[0] === '.git')
}

function emptyDir(dir: string): void {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir)) {
    if (entry === '.git') continue
    rmSync(join(dir, entry), { recursive: true, force: true })
  }
}

// Apply the RENAME map recursively to the freshly copied tree.
function applyRenames(dir: string): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) applyRenames(full)
    else if (RENAME[entry.name]) renameSync(full, join(dir, RENAME[entry.name]))
  }
}

// Stamp the project name into package.json `name` and the index.html <title>.
function injectName(dir: string, projectName: string): void {
  const pkgPath = join(dir, 'package.json')
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    pkg.name = projectName
    writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
  }
  const htmlPath = join(dir, 'index.html')
  if (existsSync(htmlPath)) {
    writeFileSync(htmlPath, readFileSync(htmlPath, 'utf8').replaceAll('PROJECT_NAME', projectName))
  }
}

// Bundled file lives at dist/index.js → templates/ sits next to dist/ at the package root.
const templatesRoot = (): string => fileURLToPath(new URL('../templates', import.meta.url))

function bail(): never {
  p.cancel('Operation cancelled.')
  process.exit(0)
}

async function main(): Promise<void> {
  const argv = mri(process.argv.slice(2), {
    string: ['template', 'pm'],
    alias: { t: 'template', h: 'help' },
  })

  if (argv.help) {
    console.log(HELP)
    return
  }

  // Read --install/--no-install and --git/--no-git as a tri-state from raw argv so
  // that "flag absent" reliably means "ask", independent of mri's default semantics.
  const raw = process.argv.slice(2)
  const triState = (name: string): boolean | undefined =>
    raw.includes(`--${name}`) ? true : raw.includes(`--no-${name}`) ? false : undefined
  let install = triState('install')
  let git = triState('git')

  console.log()
  p.intro(pc.bgCyan(pc.black(' create-nasti ')))

  // 1. Target directory
  let dirArg = argv._[0] != null ? String(argv._[0]) : undefined
  if (!dirArg) {
    const answer = await p.text({
      message: 'Project directory:',
      placeholder: 'my-nasti-app',
      defaultValue: 'my-nasti-app',
    })
    if (p.isCancel(answer)) bail()
    dirArg = (answer || 'my-nasti-app').trim()
  }
  const targetDir = resolve(process.cwd(), dirArg)
  const projectName = basename(targetDir)

  // 2. Overwrite handling
  if (!isEmptyDir(targetDir) && !argv.overwrite) {
    const action = await p.select({
      message: `${pc.yellow(dirArg)} is not empty. How would you like to proceed?`,
      options: [
        { value: 'cancel', label: 'Cancel' },
        { value: 'overwrite', label: 'Clear the directory and continue' },
        { value: 'ignore', label: 'Ignore existing files and continue' },
      ],
    })
    if (p.isCancel(action) || action === 'cancel') bail()
    if (action === 'overwrite') emptyDir(targetDir)
  }

  // 3. Template
  let template = argv.template as TemplateId | undefined
  if (template && !TEMPLATES.some((t) => t.id === template)) {
    p.log.warn(`Unknown template ${pc.yellow(template)} — please pick one below.`)
    template = undefined
  }
  if (!template) {
    const picked = await p.select({
      message: 'Select a template:',
      options: TEMPLATES.map((t) => ({ value: t.id, label: t.label, hint: t.hint })),
    })
    if (p.isCancel(picked)) bail()
    template = picked
  }

  // 4. Scaffold
  const src = join(templatesRoot(), template)
  if (!existsSync(src)) {
    p.log.error(`Template directory not found: ${src}`)
    process.exit(1)
  }
  const scaffold = p.spinner()
  scaffold.start(`Scaffolding into ${pc.cyan(dirArg)}`)
  mkdirSync(targetDir, { recursive: true })
  cpSync(src, targetDir, { recursive: true })
  applyRenames(targetDir)
  injectName(targetDir, projectName)
  scaffold.stop(`Scaffolded ${pc.cyan(template)} into ${pc.cyan(dirArg)}`)

  // 5. Package manager
  const pm = (argv.pm as PackageManager | undefined) ?? detectPm()

  // 6. Install dependencies
  if (install === undefined) {
    const ans = await p.confirm({ message: `Install dependencies with ${pc.cyan(pm)}?` })
    if (p.isCancel(ans)) bail()
    install = ans
  }
  let installed = false
  if (install) {
    const s = p.spinner()
    s.start(`Installing dependencies with ${pm}`)
    const res = spawnSync(pm, ['install'], {
      cwd: targetDir,
      stdio: 'pipe',
      shell: process.platform === 'win32',
    })
    if (res.status === 0) {
      installed = true
      s.stop(`Installed dependencies with ${pm}`)
    } else {
      s.stop(pc.yellow('Could not install dependencies — you can run it manually later.'))
      const stderr = res.stderr?.toString().trim()
      if (stderr) p.log.error(stderr.split('\n').slice(-5).join('\n'))
    }
  }

  // 7. Git
  if (git === undefined) {
    const ans = await p.confirm({ message: 'Initialize a git repository?' })
    if (p.isCancel(ans)) bail()
    git = ans
  }
  if (git && !existsSync(join(targetDir, '.git'))) {
    spawnSync('git', ['init'], { cwd: targetDir, stdio: 'ignore', shell: process.platform === 'win32' })
  }

  // 8. Next steps
  const steps = [`cd ${dirArg}`]
  if (!installed) steps.push(`${pm} install`)
  steps.push(runScript(pm, 'dev'))
  let note = steps.map((line) => pc.cyan(line)).join('\n')
  if (template === 'electron-react') {
    note += `\n\n${pc.dim('# desktop window (needs electron@^41, Node 22):')}\n${pc.cyan(runScript(pm, 'electron'))}`
  }
  p.note(note, 'Next steps')
  p.outro(`Done. Happy hacking with ${pc.cyan('Nasti')}!`)
}

main().catch((err) => {
  p.log.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
