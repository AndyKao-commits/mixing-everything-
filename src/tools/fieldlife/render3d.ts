import * as THREE from 'three'
import type { SimSnapshot } from './types'

export type FieldlifeView = {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  heroMesh: THREE.Group
  monsterMeshes: Map<number, THREE.Group>
  obstacleMeshes: THREE.Mesh[]
  dispose: () => void
  sync: (snap: SimSnapshot) => void
  resize: (width: number, height: number) => void
}

function makeHero(): THREE.Group {
  const g = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.35, 0.7, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0xf0c070, roughness: 0.35, metalness: 0.1 }),
  )
  body.position.y = 0.7
  body.castShadow = true
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xffe0b0 }),
  )
  head.position.y = 1.45
  head.castShadow = true
  const beak = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.35, 8),
    new THREE.MeshStandardMaterial({ color: 0xff8a4c }),
  )
  beak.rotation.x = Math.PI / 2
  beak.position.set(0, 1.4, 0.32)
  g.add(body, head, beak)
  return g
}

function makeMonster(color: number, kind: string): THREE.Group {
  const g = new THREE.Group()
  if (kind === 'wolf') {
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.28, 0.55, 4, 8),
      new THREE.MeshStandardMaterial({ color, roughness: 0.55 }),
    )
    body.rotation.z = Math.PI / 2
    body.position.y = 0.45
    body.castShadow = true
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0x9aa8b8 }),
    )
    head.position.set(0, 0.5, 0.45)
    g.add(body, head)
  } else if (kind === 'crystal') {
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.55),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.25,
        roughness: 0.2,
        metalness: 0.4,
      }),
    )
    crystal.position.y = 0.7
    crystal.castShadow = true
    g.add(crystal)
  } else {
    const slime = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 16, 12),
      new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.05 }),
    )
    slime.scale.y = 0.75
    slime.position.y = 0.35
    slime.castShadow = true
    g.add(slime)
  }
  return g
}

function makeObstacle(color = 0x6b7c5e): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color, roughness: 0.85 }),
  )
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

export function createFieldlifeView(canvas: HTMLCanvasElement): FieldlifeView {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.setClearColor(0x1a2433, 1)

  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0x1a2433, 28, 70)

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 120)
  camera.position.set(0, 14, 16)

  const hemi = new THREE.HemisphereLight(0xb8d4ff, 0x3a4a2e, 0.85)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight(0xffe2b8, 1.05)
  sun.position.set(12, 22, 8)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  sun.shadow.camera.near = 2
  sun.shadow.camera.far = 60
  sun.shadow.camera.left = -30
  sun.shadow.camera.right = 30
  sun.shadow.camera.top = 30
  sun.shadow.camera.bottom = -30
  scene.add(sun)

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(64, 64),
    new THREE.MeshStandardMaterial({ color: 0x3d5a45, roughness: 0.95 }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  // soft vignette plane grid
  const grid = new THREE.GridHelper(64, 32, 0x2f4538, 0x2a3c32)
  grid.position.y = 0.02
  scene.add(grid)

  const heroMesh = makeHero()
  scene.add(heroMesh)

  const monsterMeshes = new Map<number, THREE.Group>()
  const obstacleMeshes: THREE.Mesh[] = []

  const resize = (width: number, height: number) => {
    const w = Math.max(1, width)
    const h = Math.max(1, height)
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }

  const sync = (snap: SimSnapshot) => {
    const h = snap.hero
    heroMesh.position.set(h.x, 0, h.z)
    heroMesh.rotation.y = h.yaw
    heroMesh.visible = h.alive
    if (!h.alive) {
      heroMesh.rotation.x = Math.PI / 2
    } else {
      heroMesh.rotation.x = 0
    }

    // obstacles (rebuild once per snapshot size change)
    if (obstacleMeshes.length !== snap.obstacles.length) {
      for (const m of obstacleMeshes) {
        scene.remove(m)
        m.geometry.dispose()
        ;(m.material as THREE.Material).dispose()
      }
      obstacleMeshes.length = 0
      for (const o of snap.obstacles) {
        const mesh = makeObstacle(0x5c6b52)
        mesh.position.set(o.x, Math.max(o.halfW, o.halfD) * 0.55, o.z)
        mesh.scale.set(o.halfW * 2, Math.max(o.halfW, o.halfD) * 1.1, o.halfD * 2)
        scene.add(mesh)
        obstacleMeshes.push(mesh)
      }
    }

    const seen = new Set<number>()
    for (const m of snap.monsters) {
      seen.add(m.id)
      let mesh = monsterMeshes.get(m.id)
      if (!mesh) {
        mesh = makeMonster(m.color, m.kind)
        monsterMeshes.set(m.id, mesh)
        scene.add(mesh)
      }
      mesh.visible = m.alive
      mesh.position.set(m.x, 0, m.z)
      mesh.rotation.y = m.yaw
      if (m.kind === 'crystal') {
        mesh.rotation.y += snap.tick * 0.02
      }
    }
    for (const [id, mesh] of monsterMeshes) {
      if (!seen.has(id)) {
        scene.remove(mesh)
        monsterMeshes.delete(id)
      }
    }

    // chase cam
    const camTarget = new THREE.Vector3(h.x, 0, h.z)
    const camPos = new THREE.Vector3(
      h.x - Math.sin(h.yaw) * 10,
      9.5,
      h.z - Math.cos(h.yaw) * 10,
    )
    camera.position.lerp(camPos, 0.12)
    camera.lookAt(camTarget.x, 1.2, camTarget.z)

    renderer.render(scene, camera)
  }

  const dispose = () => {
    for (const m of obstacleMeshes) {
      scene.remove(m)
      m.geometry.dispose()
      ;(m.material as THREE.Material).dispose()
    }
    for (const mesh of monsterMeshes.values()) scene.remove(mesh)
    scene.remove(heroMesh)
    renderer.dispose()
  }

  return { renderer, scene, camera, heroMesh, monsterMeshes, obstacleMeshes, dispose, sync, resize }
}
