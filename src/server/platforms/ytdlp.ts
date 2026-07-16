import { mkdtemp, readFile, rm, readdir } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import youtubedl from 'youtube-dl-exec'
import { detectPlatform } from '@/lib/recipeParse'
import type { VideoSourceMaterial } from '@/server/platforms/fetchSource'

type YtDlpInfo = {
  id?: string
  title?: string
  description?: string
  uploader?: string
  channel?: string
  thumbnail?: string
  webpage_url?: string
}

function errorDetail(error: unknown) {
  if (!error || typeof error !== 'object') return String(error)
  const err = error as { message?: string; stderr?: string; shortMessage?: string }
  return err.stderr || err.shortMessage || err.message || String(error)
}

export async function fetchWithYtDlp(url: string): Promise<VideoSourceMaterial & { localAudioPath?: string }> {
  const platform = detectPlatform(url)
  const warnings: string[] = []
  const rawNotes: string[] = []

  try {
    const info = (await youtubedl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: ['referer:https://www.instagram.com/', 'user-agent:Mozilla/5.0'],
    })) as unknown as YtDlpInfo

    const caption = info.description?.trim() || undefined
    const title = info.title?.trim() || undefined
    const author = info.uploader || info.channel
    rawNotes.push(`已用 yt-dlp 讀取公開${platform}內容（他人影片可用）`)

    const dir = await mkdtemp(join(tmpdir(), 'mixing-media-'))
    const outTemplate = join(dir, 'audio.%(ext)s')
    let localAudioPath: string | undefined
    try {
      await youtubedl(url, {
        format: 'bestaudio/best',
        output: outTemplate,
        noCheckCertificates: true,
        noWarnings: true,
        maxFilesize: '20M',
        addHeader: ['referer:https://www.instagram.com/', 'user-agent:Mozilla/5.0'],
      })
      const files = await readdir(dir)
      const audio = files.find((name) => !name.endsWith('.json'))
      if (audio) {
        localAudioPath = join(dir, audio)
        rawNotes.push('已下載音訊，準備掃描旁白／語音內容')
      } else {
        warnings.push('公開影片可讀取說明，但音訊下載失敗')
        await rm(dir, { recursive: true, force: true })
      }
    } catch (audioError) {
      warnings.push(`音訊下載失敗，將先用說明文字整理（${errorDetail(audioError).slice(0, 120)}）`)
      await rm(dir, { recursive: true, force: true }).catch(() => undefined)
    }

    return {
      platform,
      title,
      caption,
      author,
      thumbnailUrl: info.thumbnail,
      warnings,
      rawNotes,
      localAudioPath,
    }
  } catch (error) {
    warnings.push(`公開影片抓取失敗：${errorDetail(error).slice(0, 240)}`)
    return { platform, warnings, rawNotes }
  }
}

export async function readLocalFileAsBlob(path: string) {
  const buf = await readFile(path)
  const ext = path.split('.').pop()?.toLowerCase() || 'bin'
  const type =
    ext === 'm4a' || ext === 'mp4'
      ? 'audio/mp4'
      : ext === 'webm'
        ? 'audio/webm'
        : ext === 'mp3'
          ? 'audio/mpeg'
          : 'application/octet-stream'
  return new Blob([buf], { type })
}

export async function cleanupLocalMedia(path?: string) {
  if (!path) return
  const dir = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : path
  await rm(dir, { recursive: true, force: true }).catch(() => undefined)
}
