module.exports = function handler(_req, res) {
  res.status(200).json({
    ok: true,
    vercel: Boolean(process.env.VERCEL),
    time: new Date().toISOString(),
    bundled: true,
  })
}
