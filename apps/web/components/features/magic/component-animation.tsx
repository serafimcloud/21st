import { useState } from "react"
import { motion } from "motion/react"

export function BaseComponent() {
  return (
    <div className="w-full h-full p-4 bg-white rounded-lg shadow-md flex flex-col items-center justify-center">
      <h2 className="text-xl font-bold text-gray-800">Base Component</h2>
      <p className="text-gray-600">This is the base content.</p>
    </div>
  )
}

interface AnimatedOverlayProps {
  hovered: boolean
}

export function AnimatedOverlay({ hovered }: AnimatedOverlayProps) {
  return (
    <motion.div
      className="absolute inset-0 rounded-lg"
      initial={{ filter: "blur(0px)" }}
      animate={{ filter: hovered ? "blur(5px)" : "blur(0px)" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="w-full h-full bg-black bg-opacity-20 flex items-center justify-center rounded-lg">
        <h2 className="text-xl font-bold text-white">Overlay Content</h2>
      </div>
    </motion.div>
  )
}

export function CombinedComponent() {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative w-96 h-64"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <BaseComponent />
      <AnimatedOverlay hovered={hovered} />
    </div>
  )
}
