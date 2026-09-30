import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, rmSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const esbuildBin = [
  'node_modules/esbuild/bin/esbuild',
  'node_modules/.bin/esbuild',
].find((p) => existsSync(p))

if (!esbuildBin) {
  // Last resort: run install script then retry
  execFileSync(process.execPath, ['node_modules/esbuild/install.js'], { stdio: 'inherit' })
}

const bin = existsSync('node_modules/esbuild/bin/esbuild')
  ? 'node_modules/esbuild/bin/esbuild'
  : 'node_modules/.bin/esbuild'

mkdirSync('api', { recursive: true })

// Fully bundle app logic; leave only Node builtins unresolved.
execFileSync(
  bin,
  [
    'scripts/vercel-api-entry.ts',
    '--bundle',
    '--platform=node',
    '--format=cjs',
    '--target=node20',
    '--outfile=api/[...path].js',
    '--legal-comments=none',
    // Optional at runtime; must not break the bundle if unresolved.
    '--external:@vercel/functions',
  ],
  { stdio: 'inherit' },
)

writeFileSync(
  'api/health.js',
  `module.exports = function handler(_req, res) {
  res.status(200).json({
    ok: true,
    vercel: Boolean(process.env.VERCEL),
    time: new Date().toISOString(),
    bundled: true,
  })
}
`,
)

// Remove TypeScript API sources so Vercel only deploys the JS bundles.
function rmTsApi(dir) {
  if (!existsSync(dir)) return
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      rmTsApi(full)
      try {
        if (readdirSync(full).length === 0) rmSync(full, { recursive: true, force: true })
      } catch {
        /* ignore */
      }
      continue
    }
    if (name.endsWith('.ts') || name.endsWith('.tsx')) {
      rmSync(full, { force: true })
      console.log('Removed', full)
    }
  }
}

rmTsApi('api')
console.log('Bundled Vercel API -> api/[...path].js + api/health.js')
