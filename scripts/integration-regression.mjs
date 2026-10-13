import assert from 'node:assert/strict'

const base = process.env.BASE_URL || 'http://127.0.0.1:3100'
async function api(path, { token, admin, data, method } = {}) {
  const res = await fetch(base + '/api/' + path, {
    method: method || (data !== undefined ? 'POST' : 'GET'),
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      ...(token ? { 'x-player-token': token } : {}),
      ...(admin ? { 'x-admin-token': admin } : {}),
    },
    ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
  })
  const value = await res.json()
  if (!res.ok) throw new Error(path + ' HTTP ' + res.status + ': ' + JSON.stringify(value))
  return value
}
const adminToken = (await api('admin/login', {data:{pin:'2468'}})).token
assert.ok(adminToken)
async function action(name, body={}) {return api('admin/action',{admin:adminToken,data:{action:name,...body}})}
async function create(name, pin) {
  const player = await action('create_player',{name})
  assert.ok(player.id)
  const auth = await api('auth/pin',{data:{playerId:player.id,pin,confirm:pin}})
  assert.ok(auth.token)
  return {...player,token:auth.token}
}
const photoOne = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRysAAAAASUVORK5CYII='
const photoTwo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
async function prepare(names) {
  const players = []
  for (let i=0;i<names.length;i++) players.push(await create(names[i],String(1111+i)))
  await action('activate')
  return players
}
async function finishToMessage(players) {
  await action('lock_scores')
  await action('open_messages')
  for (let i=0;i<players.length;i++) await api('messages',{token:players[i].token,data:{text:'Regression test '+i}})
}
const [first,second] = await prepare(['Regression One','Regression Two'])
await api('player/heartbeat',{token:first.token,data:{}})
const adminView = await api('admin/state',{admin:adminToken})
assert.ok(adminView.presence.online >= 1,'online heartbeat must update admin presence')
const view = await api('me',{token:first.token})
const cell = view.bingo.cells.find(c=>!c.mystery)
assert.ok(cell,'bingo must have at least one ordinary cell')
await api('bingo/complete',{token:first.token,data:{cellId:cell.id,photoDataUrl:photoOne}})
let photos = await api('bingo/photos',{token:first.token})
assert.equal(photos.photos[cell.id],photoOne,'completed photo must be readable')
await api('bingo/photo',{token:first.token,data:{cellId:cell.id,photoDataUrl:photoTwo}})
photos = await api('bingo/photos',{token:first.token})
assert.equal(photos.photos[cell.id],photoTwo,'replacement must persist across requests')
await finishToMessage([first,second])
await action('start_settlement')
let before = await api('me',{token:first.token})
assert.equal(before.myRank,null,'ranking must not leak before ready')
assert.equal(before.prizeDecision,null,'prize decision must not leak before reveal')
await api('settlement/ready',{token:first.token,data:{}})
before = await api('me',{token:first.token})
assert.equal(before.event.settlement_started_at,null,'countdown must wait for everyone')
assert.equal(before.myRank,null,'ranking must remain secret after one ready')
await api('settlement/ready',{token:second.token,data:{}})
before = await api('me',{token:second.token})
assert.ok(before.event.settlement_started_at,'countdown should start when all ready')
assert.equal(before.myRank,null,'ranking must stay hidden during countdown')
await new Promise(r=>setTimeout(r,10300))
const after = await api('me',{token:first.token})
assert.ok(after.myRank && typeof after.myRank.rank==='number','rank must reveal after countdown')
await action('clear_event_data')
const [third,fourth] = await prepare(['Regression Three','Regression Four'])
await action('adjust_score',{playerId:third.id,points:1,note:'CI tie-break setup'})
await finishToMessage([third,fourth])
await action('start_settlement')
await api('settlement/ready',{token:third.token,data:{}})
let forced = await api('me',{token:fourth.token})
assert.equal(forced.event.settlement_started_at,null)
await action('force_settlement_reveal')
forced = await api('me',{token:fourth.token})
assert.ok(forced.event.settlement_started_at,'host force start must begin countdown')
assert.equal(forced.myRank,null,'host force should still respect reveal embargo')
console.log('PASS: isolated player photo replacement, presence, readiness, rank privacy and host force-start')

await action('clear_event_data')
await action('set_test_access', {enabled:true,pin:'9876'})
const rehearsal = await action('create_test_bots', {count:12})
assert.equal(rehearsal.players.length,12)
assert.ok(rehearsal.players.every(p=>p.is_test_bot))
await action('activate')
const simulated = await action('simulate_test_bots')
assert.ok(simulated.rankings.some(p=>p.score>0))
await action('lock_scores')
await action('open_messages')
const replied = await action('simulate_test_bots')
assert.equal(replied.messageCount,12)
console.log('PASS bot rehearsal')


const bankBefore = await api('admin/state',{admin:adminToken})
assert.ok(bankBefore.questionBank.length > 100, 'all default question banks included')
const firstPrompt = bankBefore.questionBank.find(q=>q.category==='dont_copy')
assert.ok(firstPrompt)
await action('update_question',{id:firstPrompt.id,category:'dont_copy',text:'回歸測試編輯題'})
let bankAfter = await api('admin/state',{admin:adminToken})
assert.equal(bankAfter.questionBank.find(q=>q.id===firstPrompt.id).text,'回歸測試編輯題')
await action('update_question',{category:'who_wrote',text:'回歸測試新增題'})
bankAfter = await api('admin/state',{admin:adminToken})
const addedPrompt = bankAfter.questionBank.find(q=>q.text==='回歸測試新增題')
assert.ok(addedPrompt)
await action('delete_question',{category:'who_wrote',id:addedPrompt.id})
bankAfter = await api('admin/state',{admin:adminToken})
assert.ok(!bankAfter.questionBank.some(q=>q.id===addedPrompt.id))
console.log('PASS: persistent question bank update, add and delete')
