'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PinPad } from '@/components/PinPad'
import { api } from '@/lib/api'
import { setPlayerSession } from '@/lib/client-session'

type Step = 'pick' | 'set' | 'login'

export default function JoinPage() {
  const router = useRouter()
  const [players, setPlayers] = useState<Array<{ id: string; name: string; pin_set: boolean }>>([])
  const [selected, setSelected] = useState<{ id: string; name: string; pin_set: boolean } | null>(null)
  const [step, setStep] = useState<Step>('pick')
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [phase, setPhase] = useState<'pin' | 'confirm'>('pin')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loadingList, setLoadingList] = useState(true)

  useEffect(() => {
    api
      .state()
      .then((s) => setPlayers(s.players || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoadingList(false))
  }, [])

  function pick(p: { id: string; name: string; pin_set: boolean }) {
    setSelected(p)
    setPin('')
    setConfirm('')
    setPhase('pin')
    setError('')
    setStep(p.pin_set ? 'login' : 'set')
  }

  async function submit() {
    if (!selected) return
    setBusy(true)
    setError('')
    try {
      if (step === 'set') {
        if (phase === 'pin') {
          if (pin.length !== 4) throw new Error('請輸入 4 位 PIN')
          setPhase('confirm')
          setBusy(false)
          return
        }
        const res = await api.setPin(selected.id, pin, confirm)
        setPlayerSession(res.token)
      } else {
        const res = await api.login(selected.id, pin)
        setPlayerSession(res.token)
      }
      router.replace('/play')
    } catch (e) {
      setError(e instanceof Error ? e.message : '失敗')
      setBusy(false)
    }
  }

  useEffect(() => {
    if (step === 'login' && pin.length === 4) void submit()
    if (step === 'set' && phase === 'pin' && pin.length === 4) {
      setPhase('confirm')
    }
    if (step === 'set' && phase === 'confirm' && confirm.length === 4) void submit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, confirm, phase, step])

  if (step !== 'pick' && selected) {
    return (
      <main className="shell flex min-h-dvh flex-col justify-center gap-6 py-8">
        <button type="button" className="btn-ghost self-start" onClick={() => setStep('pick')}>
          ← 重選
        </button>
        <div className="text-center">
          <p className="text-soft">{selected.name}</p>
          <h1 className="mt-2 font-display text-3xl font-bold">
            {step === 'login' ? '輸入 PIN' : phase === 'pin' ? '設定 PIN' : '確認 PIN'}
          </h1>
        </div>
        <PinPad
          value={phase === 'confirm' ? confirm : pin}
          onChange={phase === 'confirm' ? setConfirm : setPin}
        />
        {error ? <p className="text-center text-sm text-ember">{error}</p> : null}
        {busy ? <p className="text-center text-sm text-soft">處理中…</p> : null}
      </main>
    )
  }

  return (
    <main className="shell min-h-dvh py-8">
      <a href="/" className="text-sm text-soft">
        ← 回首頁
      </a>
      <h1 className="mt-4 font-display text-3xl font-bold">你是誰？</h1>
      <p className="mt-2 text-soft">選自己的名字，設定或輸入 PIN</p>
      {loadingList ? <p className="mt-8 text-soft">載入玩家名單…</p> : null}
      <div className="mt-6 grid grid-cols-2 gap-2">
        {players.map((p) => (
          <button
            key={p.id}
            type="button"
            className="card min-h-16 text-left font-medium active:scale-[0.98]"
            onClick={() => pick(p)}
          >
            <div>{p.name}</div>
            <div className="mt-1 text-xs text-soft">{p.pin_set ? '已設定 PIN' : '首次加入'}</div>
          </button>
        ))}
      </div>
      {!loadingList && players.length === 0 ? (
        <p className="mt-4 text-sm text-ember">目前沒有玩家，請管理員先建立名單。</p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-ember">{error}</p> : null}
    </main>
  )
}
