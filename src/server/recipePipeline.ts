import { detectPlatform } from '@/lib/recipeParse'
import {
  structureRecipeLocally,
  structureRecipeWithAi,
  transcribeAudioWithWhisper,
} from '@/server/ai/recipeAi'
import { serverConfig } from '@/server/config'
import { fetchPublicPageMaterial, fetchYoutubeMaterial, type VideoSourceMaterial } from '@/server/platforms/fetchSource'
import { cleanupLocalMedia, fetchWithYtDlp, readLocalFileAsBlob } from '@/server/platforms/ytdlp'

export type ExtractRecipeResult = {
  title: string
  ingredients: string[]
  steps: string[]
  notes: string[]
  sourceUrl?: string
  platform: string
  sourceText: string
  warnings: string[]
  used: string[]
}

function mergeMaterials(parts: VideoSourceMaterial[]): VideoSourceMaterial {
  const warnings: string[] = []
  const rawNotes: string[] = []
  let title: string | undefined
  let caption: string | undefined
  let transcript: string | undefined
  let author: string | undefined
  let mediaUrl: string | undefined
  let thumbnailUrl: string | undefined
  let platform = '連結'

  for (const part of parts) {
    platform = part.platform || platform
    title = title || part.title
    caption = caption || part.caption
    transcript = transcript || part.transcript
    author = author || part.author
    mediaUrl = mediaUrl || part.mediaUrl
    thumbnailUrl = thumbnailUrl || part.thumbnailUrl
    warnings.push(...part.warnings)
    rawNotes.push(...part.rawNotes)
  }

  return { platform, title, caption, transcript, author, mediaUrl, thumbnailUrl, warnings, rawNotes }
}

export async function extractRecipeFromRequest(input: {
  url?: string
  caption?: string
  upload?: File | null
}): Promise<ExtractRecipeResult> {
  const cfg = serverConfig()
  const used: string[] = []
  const warnings: string[] = []
  const materials: VideoSourceMaterial[] = []
  const url = input.url?.trim()
  const platform = url ? detectPlatform(url) : input.upload ? '上傳影片' : '文字'
  let localAudioPath: string | undefined

  if (input.caption?.trim()) {
    materials.push({
      platform,
      caption: input.caption.trim(),
      warnings: [],
      rawNotes: ['已使用手動提供的說明／字幕'],
    })
    used.push('manual-caption')
  }

  if (url) {
    // Primary path for OTHER people's public videos (IG / TikTok / YT / etc.)
    const viaYtDlp = await fetchWithYtDlp(url)
    localAudioPath = viaYtDlp.localAudioPath
    materials.push(viaYtDlp)
    if (viaYtDlp.caption || viaYtDlp.title) used.push('ytdlp-public')
    if (viaYtDlp.localAudioPath) used.push('ytdlp-audio')

    // Extra YouTube captions when available
    if (platform === 'YouTube') {
      const yt = await fetchYoutubeMaterial(url)
      materials.push(yt)
      if (yt.transcript) used.push('youtube-transcript')
    } else if (!viaYtDlp.caption) {
      const pub = await fetchPublicPageMaterial(url)
      materials.push(pub)
      if (pub.caption) used.push('public-meta')
    }
  }

  const merged = mergeMaterials(materials)
  warnings.push(...merged.warnings)

  try {
    if (input.upload && cfg.openaiApiKey) {
      const transcript = await transcribeAudioWithWhisper(input.upload, input.upload.name || 'upload.bin')
      merged.transcript = [merged.transcript, transcript].filter(Boolean).join('\n\n')
      used.push('whisper-upload')
      merged.rawNotes.push('已用 Whisper 掃描上傳影片／音訊')
    } else if (localAudioPath && cfg.openaiApiKey) {
      const blob = await readLocalFileAsBlob(localAudioPath)
      const transcript = await transcribeAudioWithWhisper(blob, localAudioPath.split('/').pop() || 'audio.bin')
      merged.transcript = [merged.transcript, transcript].filter(Boolean).join('\n\n')
      used.push('whisper-ytdlp')
      merged.rawNotes.push('已用 Whisper 掃描公開影片音訊／旁白')
    } else if ((input.upload || localAudioPath) && !cfg.openaiApiKey) {
      warnings.push('已抓到公開影片，但未設定 OPENAI_API_KEY，無法語音掃描；會先用說明文字整理')
    }
  } finally {
    await cleanupLocalMedia(localAudioPath)
  }

  const sourceText = [merged.title, merged.caption, merged.transcript, input.caption]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join('\n\n')
    .trim()

  if (!sourceText) {
    warnings.push('還沒抓到可用內容。請確認連結是公開的，或改上傳影片檔。')
    return {
      title: merged.title || `${platform} 食譜`,
      ingredients: [],
      steps: [],
      notes: [],
      sourceUrl: url,
      platform,
      sourceText: '',
      warnings,
      used,
    }
  }

  let recipe =
    (await structureRecipeWithAi({
      titleHint: merged.title,
      sourceText,
      platform,
    })) || structureRecipeLocally(sourceText, merged.title || `${platform} 食譜`)

  if (cfg.openaiApiKey) used.push('openai-structure')
  else used.push('local-parse')

  if (merged.author) {
    recipe = {
      ...recipe,
      notes: recipe.notes.includes(`作者：${merged.author}`)
        ? recipe.notes
        : [...recipe.notes, `作者：${merged.author}`],
    }
  }

  warnings.push(...merged.rawNotes)

  return {
    title: recipe.title,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    notes: recipe.notes,
    sourceUrl: url,
    platform,
    sourceText,
    warnings,
    used,
  }
}
