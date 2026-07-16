export function serverConfig() {
  return {
    openaiApiKey: process.env.OPENAI_API_KEY?.trim() || '',
    openaiModel: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
    instagramAppId: process.env.INSTAGRAM_APP_ID?.trim() || '',
    instagramAppSecret: process.env.INSTAGRAM_APP_SECRET?.trim() || '',
    instagramRedirectUri:
      process.env.INSTAGRAM_REDIRECT_URI?.trim() || 'http://localhost:3000/api/auth/instagram/callback',
    instagramMediaApiUrl: process.env.INSTAGRAM_MEDIA_API_URL?.trim() || '',
    instagramMediaApiKey: process.env.INSTAGRAM_MEDIA_API_KEY?.trim() || '',
    instagramMediaApiHost: process.env.INSTAGRAM_MEDIA_API_HOST?.trim() || '',
    authSecret: process.env.AUTH_SECRET?.trim() || 'dev-insecure-auth-secret-change-me',
  }
}

export function capabilities() {
  const cfg = serverConfig()
  return {
    openai: Boolean(cfg.openaiApiKey),
    instagramOAuth: Boolean(cfg.instagramAppId && cfg.instagramAppSecret),
    instagramMediaApi: Boolean(cfg.instagramMediaApiUrl),
    youtubeTranscript: true,
    localTextParse: true,
    videoUploadScan: Boolean(cfg.openaiApiKey),
  }
}
