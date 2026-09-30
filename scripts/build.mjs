import { execSync, execFileSync } from 'node:child_process'
import { existsSync, renameSync, rmSync } from 'node:fs'

const isVercel = process.env.VERCEL === '1'
const appApiDir = 'app/api'
const stashDir = 'app/_api_stash'

if (isVercel && existsSync(appApiDir)) {
  rmSync(stashDir, { recursive: true, force: true })
  renameSync(appApiDir, stashDir)
  console.log('Stashed app/api for static export on Vercel')
}

try {
  if (isVercel) {
    // Ensure esbuild binary exists (npm may skip install scripts).
    if (!existsSync('node_modules/esbuild/bin/esbuild')) {
      try {
        execFileSync(process.execPath, ['node_modules/esbuild/install.js'], { stdio: 'inherit' })
      } catch (error) {
        console.warn('esbuild install.js failed', error)
      }
    }
    execSync('node scripts/bundle-api.mjs', { stdio: 'inherit', env: process.env })
  }

  execSync('next build', { stdio: 'inherit', env: process.env })
} finally {
  if (isVercel && existsSync(stashDir)) {
    rmSync(appApiDir, { recursive: true, force: true })
    renameSync(stashDir, appApiDir)
    console.log('Restored app/api after build')
  }
}
