import { lazy, Suspense } from 'react'
import './fieldlife.css'

const FieldlifeTool = lazy(async () => {
  const mod = await import('./FieldlifeTool')
  return { default: mod.FieldlifeTool }
})

export function FieldlifeLazy() {
  return (
    <Suspense fallback={<div className="fieldlife-boot">載入 Fieldlife 3D…</div>}>
      <FieldlifeTool />
    </Suspense>
  )
}
