import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sky, Float } from '@react-three/drei'
import * as THREE from 'three'

function SwayingTree(){
  const group = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (group.current) group.current.rotation.z = Math.sin(t * 0.5) * 0.05
  })
  return (
    <group ref={group}>
      {/* trunk */}
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 1.4, 12]} />
        <meshStandardMaterial color="#8b5e3c" roughness={0.9} />
      </mesh>
      {/* foliage */}
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.2}>
        <mesh position={[0, 1.5, 0]}>
          <icosahedronGeometry args={[0.6, 0]} />
          <meshStandardMaterial color="#2e7d5b" roughness={0.7} metalness={0.05} />
        </mesh>
      </Float>
    </group>
  )
}

function Ground(){
  return (
    <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#d7f5e3" />
    </mesh>
  )
}

export default function NatureScene(){
  return (
    <div className="w-full h-72 md:h-96 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800">
      <Canvas camera={{ position: [2, 1.6, 2.2], fov: 50 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 5, 2]} intensity={1.1} castShadow />
  <Sky sunPosition={[0.2, 1, 0.4]} turbidity={4} rayleigh={2} mieCoefficient={0.004} mieDirectionalG={0.9} />
        <SwayingTree />
        <Ground />
        <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.4} />
      </Canvas>
    </div>
  )
}
