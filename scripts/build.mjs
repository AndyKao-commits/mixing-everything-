import { execSync } from 'node:child_process'
import { existsSync, renameSync, rmSync } from 'node:fs'

const isVercel = process.env.VERCEL === '1'
const apiDir = 'app/api'
const stashDir = 'app/_api_stash'

if (isVercel && existsSync(apiDir)) {
  rmSync(stashDir, { recursive: true, force: true })
  renameSync(apiDir, stashDir)
  console.log('Stashed app/api for static export on Vercel')
}

try {
  execSync('next build', { stdio: 'inherit', env: process.env })
} finally {
  if (isVercel && existsSync(stashDir)) {
    rmSync(apiDir, { recursive: true, force: true })
    renameSync(stashDir, apiDir)
    console.log('Restored app/api after build')
  }
}
