import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '今晚誰會贏？',
    short_name: '派對遊戲',
    description: '烤肉聚會積分遊戲',
    start_url: '/play',
    display: 'standalone',
    background_color: '#fffaf5',
    theme_color: '#e85d04',
    lang: 'zh-Hant',
  }
}
