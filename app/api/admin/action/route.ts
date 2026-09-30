import { NextResponse } from 'next/server'
import { gameStore } from '@/lib/game-store'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const token = req.headers.get('x-admin-token') || ''
    const body = await req.json()
    const action = String(body.action || '')

    switch (action) {
      case 'activate':
        return NextResponse.json(gameStore.activateEvent(token))
      case 'create_player':
        return NextResponse.json(gameStore.createPlayer(token, String(body.name || '')))
      case 'rename_player':
        return NextResponse.json(
          gameStore.renamePlayer(token, String(body.playerId), String(body.name || '')),
        )
      case 'delete_player':
        return NextResponse.json({ ok: gameStore.deletePlayer(token, String(body.playerId)) })
      case 'adjust_score':
        return NextResponse.json(
          gameStore.adjustScore(
            token,
            String(body.playerId),
            Number(body.points || 0),
            String(body.note || ''),
          ),
        )
      case 'start_dont_copy':
        return NextResponse.json(gameStore.startDontCopyMe(token))
      case 'score_dont_copy':
        return NextResponse.json(
          gameStore.scoreDontCopyRound(token, (body.uniquePlayerIds || []) as string[]),
        )
      case 'next_dont_copy':
        return NextResponse.json(gameStore.nextDontCopyRound(token))
      case 'start_who_wrote':
        return NextResponse.json(gameStore.startWhoWroteIt(token))
      case 'draw_who_wrote':
        return NextResponse.json(gameStore.drawWhoWroteAnswer(token))
      case 'end_group_game':
        return NextResponse.json({ ok: gameStore.endGroupGame(token) })
      case 'start_final_button':
        return NextResponse.json(gameStore.startFinalButton(token))
      case 'finish_final_button':
        return NextResponse.json(gameStore.finishFinalButton(token))
      case 'open_messages':
        return NextResponse.json(gameStore.openMessages(token))
      case 'lock_scores':
        return NextResponse.json(gameStore.lockScores(token))
      case 'start_settlement':
        return NextResponse.json(
          gameStore.startSettlement(token, body.tieBreakOrder as string[] | undefined),
        )
      case 'finish_event':
        return NextResponse.json(gameStore.finishEvent(token))
      case 'top_ties':
        gameStore.requireAdmin(token)
        return NextResponse.json({ ties: gameStore.topTies() })
      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 })
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '錯誤' }, { status: 400 })
  }
}
