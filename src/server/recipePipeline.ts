import { detectPlatform } from '@/lib/recipeParse'
import {
  structureRecipeLocally,
  structureRecipeWithAi,
  transcribeAudioWithWhisper,
  transcribeRemoteMedia,
} from '@/server/ai/recipeAi'
import { serverConfig } from '@/server/config'
import { fetchPublicPageMaterial, fetchYoutubeMaterial, type VideoSourceMaterial } from '@/server/platforms/fetchSource'
import {
  fetchInstagramViaMediaApi,
  fetchInstagramWithSession,
} from '@/server/platforms/instagram'
import type { InstagramSession } from '@/server/instagramSession'

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
  session?: InstagramSession | null
  upload?: File | null
}): Promise<ExtractRecipeResult> {
  const cfg = serverConfig()
  const used: string[] = []
  const warnings: string[] = []
  const materials: VideoSourceMaterial[] = []
  const url = input.url?.trim()
  const platform = url ? detectPlatform(url) : input.upload ? '上傳影片' : '文字'

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
    if (platform === 'YouTube') {
      const yt = await fetchYoutubeMaterial(url)
      materials.push(yt)
      if (yt.transcript) used.push('youtube-transcript')
      if (yt.title) used.push('youtube-oembed')
    } else if (platform === 'Instagram') {
      if (input.session) {
        const ig = await fetchInstagramWithSession(url, input.session)
        materials.push(ig)
        if (ig.caption || ig.mediaUrl) used.push('instagram-oauth')
      }
      if (cfg.instagramMediaApiUrl) {
        const viaApi = await fetchInstagramViaMediaApi(url)
        materials.push(viaApi)
        if (viaApi.caption || viaApi.mediaUrl) used.push('instagram-media-api')
      }
      const pub = await fetchPublicPageMaterial(url)
      materials.push(pub)
      if (pub.caption) used.push('public-meta')
    } else {
      const pub = await fetchPublicPageMaterial(url)
      materials.push(pub)
      if (pub.caption) used.push('public-meta')
    }
  }

  const merged = mergeMaterials(materials)
  warnings.push(...merged.warnings)

  // Scan audio/video content when possible
  if (input.upload && cfg.openaiApiKey) {
    try {
      const transcript = await transcribeAudioWithWhisper(input.upload, input.upload.name || 'upload.bin')
      merged.transcript = [merged.transcript, transcript].filter(Boolean).join('\n\n')
      used.push('whisper-upload')
      merged.rawNotes.push('已用 Whisper 掃描上傳影片／音訊')
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : '上傳影片掃描失敗')
    }
  } else if (merged.mediaUrl && cfg.openaiApiKey) {
    try {
      const transcript = await transcribeRemoteMedia(merged.mediaUrl)
      merged.transcript = [merged.transcript, transcript].filter(Boolean).join('\n\n')
      used.push('whisper-remote')
      merged.rawNotes.push('已用 Whisper 掃描遠端影片音訊')
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : '遠端影片掃描失敗')
    }
  } else if ((input.upload || merged.mediaUrl) && !cfg.openaiApiKey) {
    warnings.push('已取得影片，但未設定 OPENAI_API_KEY，無法做音訊掃描')
  }

  const sourceText = [merged.title, merged.caption, merged.transcript, input.caption]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join('\n\n')
    .trim()

  if (!sourceText) {
    if (platform === 'Instagram') {
      warnings.push('Instagram 常擋未登入抓取。請先「登入 Instagram」，或改上傳影片／貼上說明文字。')
    }
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
