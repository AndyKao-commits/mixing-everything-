import { beginPersistenceRequest } from './persist'
import { beginGameStoreRequest, gameStore } from './game-store'

type HeadersLike = {
  get(name: string): string | null
}

export async function routeApiRequest(input: {
  method: string
  path: string
  headers: HeadersLike
  body: any
}): Promise<{ status: number; data: unknown }> {
  beginPersistenceRequest()
  beginGameStoreRequest()
  const method = input.method.toUpperCase()
  const path = input.path.replace(/^\/+|\/+$/g, '')
  const playerToken = input.headers.get('x-player-token') || ''
  const adminToken = input.headers.get('x-admin-token') || ''
  const body = input.body || {}

  try {
    const hadDurableState = await gameStore.load({ hydratePhotos: method === 'GET' && path === 'me' })
    let result: { status: number; data: unknown }

    if (method === 'GET' && path === 'state') {
      result = { status: 200, data: gameStore.getPublicState() }
    } else if (method === 'POST' && path === 'auth/pin') {
      result = {
        status: 200,
        data: gameStore.setPlayerPin(String(body.playerId), String(body.pin), String(body.confirm)),
      }
    } else if (method === 'POST' && path === 'auth/login') {
      result = {
        status: 200,
        data: gameStore.loginPlayer(String(body.playerId), String(body.pin)),
      }
    } else if (method === 'GET' && path === 'me') {
      result = { status: 200, data: gameStore.getPlayerView(playerToken) }
    } else if (method === 'POST' && path === 'bingo/reveal') {
      result = { status: 200, data: { cell: gameStore.revealMystery(playerToken, String(body.cellId)) } }
    } else if (method === 'POST' && path === 'bingo/complete') {
      result = {
        status: 200,
        data: gameStore.completeBingoCell(
          playerToken,
          String(body.cellId),
          String(body.photoDataUrl || ''),
        ),
      }
    } else if (method === 'POST' && path === 'tasks/secret') {
      result = { status: 200, data: gameStore.completeSecret(playerToken) }
    } else if (method === 'POST' && path === 'tasks/target') {
      result = { status: 200, data: gameStore.completeTarget(playerToken) }
    } else if (method === 'POST' && path === 'tasks/bounty') {
      result = {
        status: 200,
        data: gameStore.completeBounty(playerToken, String(body.bountyId)),
      }
    } else if (method === 'POST' && path === 'games/who-wrote/answer') {
      gameStore.submitWhoWroteAnswer(playerToken, String(body.text || ''))
      result = { status: 200, data: { ok: true } }
    } else if (method === 'POST' && path === 'games/who-wrote/vote') {
      gameStore.voteWhoWrote(playerToken, String(body.guessedPlayerId))
      result = { status: 200, data: { ok: true } }
    } else if (method === 'POST' && path === 'games/final-button/click') {
      result = {
        status: 200,
        data: await gameStore.clickFinalButton(playerToken, Number(body.clientTs || Date.now()), Number(body.clickCount || 1)),
      }
    } else if (method === 'POST' && path === 'messages') {
      gameStore.submitMessage(playerToken, String(body.text || ''))
      result = { status: 200, data: { ok: true } }
    } else if (method === 'POST' && path === 'settlement/decide') {
      const choice = body.choice === 'donate' ? 'donate' : 'keep'
      result = { status: 200, data: gameStore.decidePrize(playerToken, choice) }
    } else if (method === 'POST' && path === 'admin/login') {
      result = { status: 200, data: gameStore.adminLogin(String(body.pin || '')) }
    } else if (method === 'GET' && path === 'admin/state') {
      gameStore.requireAdmin(adminToken)
      result = { status: 200, data: gameStore.getAdminState() }
    } else if (method === 'POST' && path === 'admin/action') {
      const action = String(body.action || '')
      switch (action) {
        case 'clear_event_data':
          result = { status: 200, data: await gameStore.clearEventData(adminToken) }
          break
        case 'activate':
          result = { status: 200, data: gameStore.activateEvent(adminToken) }
          break
        case 'create_player':
          result = { status: 200, data: gameStore.createPlayer(adminToken, String(body.name || '')) }
          break
        case 'rename_player':
          result = {
            status: 200,
            data: gameStore.renamePlayer(adminToken, String(body.playerId), String(body.name || '')),
          }
          break
        case 'delete_player':
          result = { status: 200, data: { ok: gameStore.deletePlayer(adminToken, String(body.playerId)) } }
          break
        case 'adjust_score':
          result = {
            status: 200,
            data: gameStore.adjustScore(
              adminToken,
              String(body.playerId),
              Number(body.points || 0),
              String(body.note || ''),
            ),
          }
          break
        case 'start_dont_copy':
          result = { status: 200, data: gameStore.startDontCopyMe(adminToken) }
          break
        case 'score_dont_copy':
          result = {
            status: 200,
            data: gameStore.scoreDontCopyRound(adminToken, (body.uniquePlayerIds || []) as string[]),
          }
          break
        case 'next_dont_copy':
          result = { status: 200, data: gameStore.nextDontCopyRound(adminToken) }
          break
        case 'start_who_wrote':
          result = { status: 200, data: gameStore.startWhoWroteIt(adminToken) }
          break
        case 'draw_who_wrote':
          result = { status: 200, data: gameStore.drawWhoWroteAnswer(adminToken) }
          break
        case 'reveal_who_wrote':
          result = { status: 200, data: gameStore.revealWhoWroteAnswer(adminToken) }
          break
        case 'end_group_game':
          result = { status: 200, data: { ok: gameStore.endGroupGame(adminToken) } }
          break
        case 'start_final_button':
          result = { status: 200, data: gameStore.startFinalButton(adminToken) }
          break
        case 'finish_final_button':
          result = { status: 200, data: await gameStore.finishFinalButton(adminToken) }
          break
        case 'open_messages':
          result = { status: 200, data: gameStore.openMessages(adminToken) }
          break
        case 'lock_scores':
          result = { status: 200, data: gameStore.lockScores(adminToken) }
          break
        case 'start_settlement':
          result = {
            status: 200,
            data: gameStore.startSettlement(adminToken, body.tieBreakOrder as string[] | undefined),
          }
          break
        case 'finish_event':
          result = { status: 200, data: gameStore.finishEvent(adminToken) }
          break
        case 'top_ties':
          gameStore.requireAdmin(adminToken)
          result = { status: 200, data: { ties: gameStore.topTies() } }
          break
        default:
          result = { status: 400, data: { error: '未知操作' } }
      }
    } else {
      result = { status: 404, data: { error: `找不到 API: ${method} /${path}` } }
    }

    const isFinalTap = method === 'POST' && path === 'games/final-button/click'
    const shouldPersist = result.status < 400 && !isFinalTap && (method !== 'GET' || !hadDurableState)
    if (shouldPersist) {
      if (method === 'POST' && path === 'bingo/complete') {
        const completedCell = (result.data as any)?.bingo?.cells?.find((cell: any) => cell.id === String(body.cellId))
        if (completedCell?.photo_data_url?.startsWith('data:')) {
          const { persistSetPhoto } = await import('./persist')
          await persistSetPhoto(completedCell.id, completedCell.photo_data_url)
        }
      }
      await gameStore.save()
    }
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : '錯誤'
    if (message === 'STATE_CONFLICT') {
      return { status: 409, data: { error: '資料剛被其他玩家更新，請再試一次' } }
    }
    const status =
      message.includes('未登入') || message.includes('請重新登入') || message.includes('管理員未登入')
        ? 401
        : 400
    return { status, data: { error: message } }
  }
}
