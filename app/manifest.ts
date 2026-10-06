import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '今晚誰會贏？',
    short_name: '派對遊戲',
    description: '烤肉聚會積分遊戲',
    start_url: '/play',
    display: 'standalone',
    background_color: '#f7f8fa',
    theme_color: '#e85d04',
    lang: 'zh-Hant',
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  }
}
