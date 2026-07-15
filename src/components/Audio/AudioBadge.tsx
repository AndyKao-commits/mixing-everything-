'use client'

/** Audio cue helper surface for settings / combat — synthesis lives in AudioSystem. */
export function AudioBadge({ enabled }: { enabled: boolean }) {
  return <span className="text-xs text-raid-muted">{enabled ? '音效開' : '音效關'}</span>
}
