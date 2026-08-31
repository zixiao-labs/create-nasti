import * as p from '@clack/prompts'
import { spawn } from 'node:child_process'

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'
type InstallResult = 'installed' | 'failed' | 'cancelled'

// Keep only the tail: package-manager output can be very large on a fresh install.
const MAX_OUTPUT_LENGTH = 64 * 1024

export async function installDependencies(pm: PackageManager, cwd: string): Promise<InstallResult> {
  const controller = new AbortController()
  const spinner = p.spinner({
    indicator: 'timer',
    cancelMessage: 'Dependency installation cancelled.',
    onCancel: () => controller.abort(),
  })
  let output = ''
  const capture = (chunk: string) => {
    output = (output + chunk).slice(-MAX_OUTPUT_LENGTH)
  }

  spinner.start(`Installing dependencies with ${pm}`)
  try {
    // This must stay asynchronous: spawnSync blocks the spinner's animation timer.
    const result = await new Promise<{ code: number | null; signal: string | null; error?: Error }>((resolve) => {
      const child = spawn(pm, ['install'], {
        cwd,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
        signal: controller.signal,
      })
      let error: Error | undefined
      child.stdout.setEncoding('utf8').on('data', capture)
      child.stderr.setEncoding('utf8').on('data', capture)
      child.once('error', (err) => { error = err })
      // Wait for close (not exit) so the final stdout/stderr bytes are captured.
      child.once('close', (code, signal) => resolve({ code, signal, error }))
    })

    if (controller.signal.aborted) return 'cancelled'
    if (result.code === 0 && !result.error) {
      spinner.stop(`Installed dependencies with ${pm}`)
      return 'installed'
    }
    throw result.error ?? new Error(
      result.signal ? `${pm} install was terminated by ${result.signal}.` : `${pm} install exited with code ${result.code}.`,
    )
  } catch (error) {
    if (controller.signal.aborted) return 'cancelled'
    spinner.error('Could not install dependencies — you can run it manually later.')
    p.log.error(error instanceof Error ? error.message : String(error))
    const tail = output.trim().split(/\r?\n/).slice(-10).join('\n')
    if (tail) p.log.error(tail)
    return 'failed'
  }
}
