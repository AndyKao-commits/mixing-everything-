const baseUrl = (process.env.BASE_URL || '').replace(/\/$/, '')
const users = Math.min(50, Math.max(1, Number(process.env.USERS || 15)))
const rounds = Math.min(100, Math.max(1, Number(process.env.ROUNDS || 20)))
const timeoutMs = Math.max(1000, Number(process.env.TIMEOUT_MS || 8000))

if (!baseUrl) {
  console.error('Missing BASE_URL, e.g. BASE_URL=https://your-site.vercel.app npm run load:test')
  process.exit(1)
}

const samples = []
let failures = 0

async function hit(user, round) {
  const started = performance.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(baseUrl + '/api/state', {
      headers: { accept: 'application/json', 'x-load-test-user': String(user) },
      cache: 'no-store',
      signal: controller.signal,
    })
    const elapsed = performance.now() - started
    samples.push(elapsed)
    if (!res.ok) {
      failures += 1
      console.error('FAIL', { user, round, status: res.status, elapsed: Math.round(elapsed) })
      return
    }
    await res.json()
  } catch (error) {
    failures += 1
    console.error('ERROR', { user, round, message: error instanceof Error ? error.message : String(error) })
  } finally {
    clearTimeout(timeout)
  }
}

for (let round = 1; round <= rounds; round += 1) {
  await Promise.all(Array.from({ length: users }, (_, i) => hit(i + 1, round)))
}

samples.sort((a, b) => a - b)
const percentile = (p) => samples.length ? samples[Math.min(samples.length - 1, Math.floor(samples.length * p))] : 0
const avg = samples.length ? samples.reduce((sum, n) => sum + n, 0) / samples.length : 0
const total = users * rounds

console.log(JSON.stringify({
  baseUrl,
  virtualUsers: users,
  rounds,
  requests: total,
  success: total - failures,
  failures,
  failureRate: total ? Number((failures / total * 100).toFixed(2)) : 0,
  latencyMs: {
    avg: Math.round(avg),
    p50: Math.round(percentile(0.50)),
    p95: Math.round(percentile(0.95)),
    p99: Math.round(percentile(0.99)),
    max: Math.round(samples.at(-1) || 0),
  },
}, null, 2))

if (failures > 0) process.exitCode = 2
