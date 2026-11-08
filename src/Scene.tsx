import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, useGLTF, Float, ContactShadows, PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'

const progress = { value: 0 }

/** Position de la caméra / voiture pour chaque section (0 → 1 de scroll). */
const KEYS = [
  { x: 1.4, y: 0.2, rot: -0.6, scale: 1 },
  { x: -1.6, y: 0.1, rot: 0.9, scale: 0.9 },
  { x: 1.5, y: -0.1, rot: 2.4, scale: 0.9 },
  { x: -1.4, y: 0.2, rot: 3.9, scale: 0.95 },
  { x: 0, y: 0.1, rot: 5.4, scale: 1.05 },
]

function Car({ mobile }: { mobile: boolean }) {
  const { scene } = useGLTF('/voiture.glb')
  const group = useRef<THREE.Group>(null!)

  const model = useMemo(() => {
    const clone = scene.clone(true)
    const box = new THREE.Box3().setFromObject(clone)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const s = 4.2 / Math.max(size.x, size.y, size.z)
    clone.scale.setScalar(s)
    clone.position.set(-center.x * s, -center.y * s, -center.z * s)
    return clone
  }, [scene])

  useFrame((_, dt) => {
    const t = progress.value * (KEYS.length - 1)
    const i = Math.min(Math.floor(t), KEYS.length - 2)
    const f = t - i
    const e = f * f * (3 - 2 * f)
    const a = KEYS[i], b = KEYS[i + 1]
    const lerp = (p: number, q: number) => p + (q - p) * e
    const k = 1 - Math.exp(-dt * 4)
    const g = group.current
    g.position.x += ((mobile ? 0 : lerp(a.x, b.x)) - g.position.x) * k
    g.position.y += ((mobile ? 1.35 + lerp(a.y, b.y) * 0.3 : lerp(a.y, b.y)) - g.position.y) * k
    g.rotation.y += (lerp(a.rot, b.rot) - g.rotation.y) * k
    g.scale.setScalar(g.scale.x + (lerp(a.scale, b.scale) * (mobile ? 0.5 : 1) - g.scale.x) * k)
  })

  return (
    <group ref={group} scale={1}>
      <primitive object={model} />
    </group>
  )
}

/** Pièces mécaniques flottantes (jante, disque de frein, écrous) en primitives 3D. */
function Parts() {
  const wheel = useRef<THREE.Mesh>(null!)
  useFrame((_, dt) => { wheel.current.rotation.z += dt * 0.6 })
  const metal = { color: '#e9e1cc', metalness: 0.55, roughness: 0.4 } as const
  return (
    <>
      <Float speed={1.5} rotationIntensity={0.6} floatIntensity={1.2}>
        <mesh ref={wheel} position={[-0.6, 2.5, -5]} rotation={[1.2, 0.3, 0]}>
          <torusGeometry args={[0.6, 0.15, 24, 64]} />
          <meshStandardMaterial {...metal} />
        </mesh>
      </Float>
      <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>
        <mesh position={[4.6, -1.6, -4]} rotation={[0.4, 0.2, 0.9]}>
          <cylinderGeometry args={[0.5, 0.5, 0.12, 48]} />
          <meshStandardMaterial color="#d6b25e" metalness={0.6} roughness={0.35} />
        </mesh>
      </Float>
      <Float speed={1.2} rotationIntensity={1.2} floatIntensity={1}>
        <mesh position={[3.2, 2.4, -5]}>
          <icosahedronGeometry args={[0.35, 0]} />
          <meshStandardMaterial {...metal} />
        </mesh>
      </Float>
      <Float speed={1.8} rotationIntensity={0.8} floatIntensity={1.4}>
        <mesh position={[-4.6, -1.9, -5]}>
          <octahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial color="#d6b25e" metalness={0.6} roughness={0.35} />
        </mesh>
      </Float>
    </>
  )
}

function useIsMobile() {
  const [m, setM] = useState(() => window.innerWidth < 760)
  useEffect(() => {
    const on = () => setM(window.innerWidth < 760)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return m
}

function Rig() {
  useFrame(({ camera, pointer }, dt) => {
    camera.position.x += (pointer.x * 0.6 - camera.position.x) * (1 - Math.exp(-dt * 3))
    camera.position.y += (pointer.y * 0.3 + 0.6 - camera.position.y) * (1 - Math.exp(-dt * 3))
    camera.lookAt(0, 0, 0)
  })
  return null
}

export default function Scene() {
  const mobile = useIsMobile()
  const [dpr, setDpr] = useState(mobile ? 1.25 : 1.5)
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      progress.value = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="scene" aria-hidden="true">
      <Canvas camera={{ position: [0, 0.6, 7], fov: 38 }} dpr={dpr} gl={{ antialias: !mobile, powerPreference: 'high-performance' }}>
        <color attach="background" args={['#faf8f3']} />
        <fog attach="fog" args={['#faf8f3', 9, 18]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[4, 6, 3]} intensity={2.2} />
        <pointLight position={[-4, 1, 2]} intensity={30} color="#C9A14A" />
        <Suspense fallback={null}>
          <Environment resolution={256}>
            <Lightformer form="rect" intensity={4} position={[0, 5, -3]} scale={[10, 2, 1]} />
            <Lightformer form="rect" intensity={2} color="#C9A14A" position={[-5, 1, 2]} scale={[2, 4, 1]} />
            <Lightformer form="rect" intensity={2} position={[5, 1, 2]} scale={[2, 4, 1]} />
          </Environment>
          <Car mobile={mobile} />
          {!mobile && <Parts />}
          {!mobile && <ContactShadows position={[0, -2.1, 0]} opacity={0.55} scale={14} blur={2.6} far={4} />}
        </Suspense>
        <Rig />
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(mobile ? 1.25 : 1.5)} />
      </Canvas>
    </div>
  )
}

useGLTF.preload('/voiture.glb')
