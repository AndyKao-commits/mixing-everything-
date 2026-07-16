export function serverConfig() {
  return {
    openaiApiKey: process.env.OPENAI_API_KEY?.trim() || '',
    openaiModel: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
  }
}

export function capabilities() {
  const cfg = serverConfig()
  return {
    openai: Boolean(cfg.openaiApiKey),
    youtubeTranscript: true,
    localTextParse: true,
    videoUploadScan: Boolean(cfg.openaiApiKey),
    publicVideoFetch: true,
    othersRecipes: true,
  }
}
