import { gameStore } from '@/lib/game-store'

type HeadersLike = {
  get(name: string): string | null
}

export async function routeApiRequest(input: {
  method: string
  path: string
  headers: HeadersLike
  body: any
}): Promise<{ status: number; data: unknown }> {
  const method = input.method.toUpperCase()
  const path = input.path.replace(/^\/+|\/+$/g, '')
  const playerToken = input.headers.get('x-player-token') || ''
  const adminToken = input.headers.get('x-admin-token') || ''
  const body = input.body || {}

  try {
    if (method === 'GET' && path === 'state') {
      return { status: 200, data: gameStore.getPublicState() }
    }

    if (method === 'POST' && path === 'auth/pin') {
      return {
        status: 200,
        data: gameStore.setPlayerPin(String(body.playerId), String(body.pin), String(body.confirm)),
      }
    }

    if (method === 'POST' && path === 'auth/login') {
      return {
        status: 200,
        data: gameStore.loginPlayer(String(body.playerId), String(body.pin)),
      }
    }

    if (method === 'GET' && path === 'me') {
      gameStore.finalizeDonationDefaults()
      return { status: 200, data: gameStore.getPlayerView(playerToken) }
    }

    if (method === 'POST' && path === 'bingo/reveal') {
      return { status: 200, data: { cell: gameStore.revealMystery(playerToken, String(body.cellId)) } }
    }

    if (method === 'POST' && path === 'bingo/complete') {
      return {
        status: 200,
        data: gameStore.completeBingoCell(
          playerToken,
          String(body.cellId),
          String(body.photoDataUrl || ''),
        ),
      }
    }

    if (method === 'POST' && path === 'tasks/secret') {
      return { status: 200, data: gameStore.completeSecret(playerToken) }
    }

    if (method === 'POST' && path === 'tasks/target') {
      return { status: 200, data: gameStore.completeTarget(playerToken) }
    }

    if (method === 'POST' && path === 'tasks/bounty') {
      return {
        status: 200,
        data: gameStore.completeBounty(playerToken, String(body.bountyId)),
      }
    }

    if (method === 'POST' && path === 'games/dont-copy/answer') {
      gameStore.submitDontCopyAnswer(playerToken, String(body.text || ''))
      return { status: 200, data: { ok: true } }
    }

    if (method === 'POST' && path === 'games/who-wrote/answer') {
      gameStore.submitWhoWroteAnswer(playerToken, String(body.text || ''))
      return { status: 200, data: { ok: true } }
    }

    if (method === 'POST' && path === 'games/who-wrote/vote') {
      gameStore.voteWhoWrote(playerToken, String(body.guessedPlayerId))
      return { status: 200, data: { ok: true } }
    }

    if (method === 'POST' && path === 'games/final-button/click') {
      return {
        status: 200,
        data: gameStore.clickFinalButton(playerToken, Number(body.clientTs || Date.now())),
      }
    }

    if (method === 'POST' && path === 'messages') {
      gameStore.submitMessage(playerToken, String(body.text || ''))
      return { status: 200, data: { ok: true } }
    }

    if (method === 'POST' && path === 'settlement/decide') {
      const choice = body.choice === 'donate' ? 'donate' : 'keep'
      return { status: 200, data: gameStore.decidePrize(playerToken, choice) }
    }

    if (method === 'POST' && path === 'admin/login') {
      return { status: 200, data: gameStore.adminLogin(String(body.pin || '')) }
    }

    if (method === 'GET' && path === 'admin/state') {
      gameStore.requireAdmin(adminToken)
      gameStore.finalizeDonationDefaults()
      return { status: 200, data: gameStore.getAdminState() }
    }

    if (method === 'POST' && path === 'admin/action') {
      const action = String(body.action || '')
      switch (action) {
        case 'activate':
          return { status: 200, data: gameStore.activateEvent(adminToken) }
        case 'create_player':
          return { status: 200, data: gameStore.createPlayer(adminToken, String(body.name || '')) }
        case 'rename_player':
          return {
            status: 200,
            data: gameStore.renamePlayer(adminToken, String(body.playerId), String(body.name || '')),
          }
        case 'delete_player':
          return { status: 200, data: { ok: gameStore.deletePlayer(adminToken, String(body.playerId)) } }
        case 'adjust_score':
          return {
            status: 200,
            data: gameStore.adjustScore(
              adminToken,
              String(body.playerId),
              Number(body.points || 0),
              String(body.note || ''),
            ),
          }
        case 'start_dont_copy':
          return { status: 200, data: gameStore.startDontCopyMe(adminToken) }
        case 'score_dont_copy':
          return {
            status: 200,
            data: gameStore.scoreDontCopyRound(adminToken, (body.uniquePlayerIds || []) as string[]),
          }
        case 'next_dont_copy':
          return { status: 200, data: gameStore.nextDontCopyRound(adminToken) }
        case 'start_who_wrote':
          return { status: 200, data: gameStore.startWhoWroteIt(adminToken) }
        case 'draw_who_wrote':
          return { status: 200, data: gameStore.drawWhoWroteAnswer(adminToken) }
        case 'end_group_game':
          return { status: 200, data: { ok: gameStore.endGroupGame(adminToken) } }
        case 'start_final_button':
          return { status: 200, data: gameStore.startFinalButton(adminToken) }
        case 'finish_final_button':
          return { status: 200, data: gameStore.finishFinalButton(adminToken) }
        case 'open_messages':
          return { status: 200, data: gameStore.openMessages(adminToken) }
        case 'lock_scores':
          return { status: 200, data: gameStore.lockScores(adminToken) }
        case 'start_settlement':
          return {
            status: 200,
            data: gameStore.startSettlement(adminToken, body.tieBreakOrder as string[] | undefined),
          }
        case 'finish_event':
          return { status: 200, data: gameStore.finishEvent(adminToken) }
        case 'top_ties':
          gameStore.requireAdmin(adminToken)
          return { status: 200, data: { ties: gameStore.topTies() } }
        default:
          return { status: 400, data: { error: '未知操作' } }
      }
    }

    return { status: 404, data: { error: `找不到 API: ${method} /${path}` } }
  } catch (error) {
    const message = error instanceof Error ? error.message : '錯誤'
    const status =
      message.includes('未登入') || message.includes('請重新登入') || message.includes('管理員未登入')
        ? 401
        : 400
    return { status, data: { error: message } }
  }
}
