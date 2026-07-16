import OpenAI from 'openai'
import { parseRecipeFromText, type ParsedRecipe } from '@/lib/recipeParse'
import { serverConfig } from '@/server/config'

export async function structureRecipeWithAi(input: {
  titleHint?: string
  sourceText: string
  platform?: string
}): Promise<ParsedRecipe | null> {
  const cfg = serverConfig()
  if (!cfg.openaiApiKey || !input.sourceText.trim()) return null

  const client = new OpenAI({ apiKey: cfg.openaiApiKey })
  const completion = await client.chat.completions.create({
    model: cfg.openaiModel,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          '你是食譜整理助手。從影片說明、字幕或逐字稿整理出食譜 JSON：{"title":string,"ingredients":string[],"steps":string[],"notes":string[]}。只輸出 JSON。若資訊不足仍盡力整理，不要捏造不存在的食材。',
      },
      {
        role: 'user',
        content: JSON.stringify({
          platform: input.platform,
          titleHint: input.titleHint,
          sourceText: input.sourceText.slice(0, 12000),
        }),
      },
    ],
  })

  const raw = completion.choices[0]?.message?.content
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<ParsedRecipe>
    return {
      title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : input.titleHint || '未命名食譜',
      ingredients: Array.isArray(parsed.ingredients)
        ? parsed.ingredients.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((x) => x.trim())
        : [],
      steps: Array.isArray(parsed.steps)
        ? parsed.steps.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((x) => x.trim())
        : [],
      notes: Array.isArray(parsed.notes)
        ? parsed.notes.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((x) => x.trim())
        : [],
    }
  } catch {
    return null
  }
}

export async function transcribeAudioWithWhisper(file: File | Blob, filename = 'audio.webm') {
  const cfg = serverConfig()
  if (!cfg.openaiApiKey) throw new Error('未設定 OPENAI_API_KEY，無法掃描影片音訊')

  const client = new OpenAI({ apiKey: cfg.openaiApiKey })
  const transcription = await client.audio.transcriptions.create({
    file: new File([file], filename, { type: file.type || 'audio/webm' }),
    model: 'whisper-1',
    response_format: 'text',
  })
  return String(transcription)
}

export async function transcribeRemoteMedia(mediaUrl: string) {
  const res = await fetch(mediaUrl)
  if (!res.ok) throw new Error(`無法下載影片音訊（HTTP ${res.status}）`)
  const blob = await res.blob()
  const ext = mediaUrl.includes('.mp4') ? 'video.mp4' : 'media.bin'
  return transcribeAudioWithWhisper(blob, ext)
}

export function structureRecipeLocally(sourceText: string, titleHint?: string): ParsedRecipe {
  return parseRecipeFromText(sourceText, titleHint || '未命名食譜')
}
