'use client'

import { createContext } from 'react'

export type PlayerViewValue = {
  data: any
  error: string
  loading: boolean
  refresh: () => Promise<void>
  setData: React.Dispatch<React.SetStateAction<any>>
}

export const PlayerViewContext = createContext<PlayerViewValue | null>(null)
