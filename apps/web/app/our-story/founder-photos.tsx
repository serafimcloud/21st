"use client"

import { useState, useEffect, useRef } from "react"

// New photos in chronological order
const photos = [
  "/story/photo_2025-05-14 20.49.00.jpeg", // First photo
  "/story/photo_2025-05-14 20.49.02.jpeg",
  "/story/photo_2025-05-14 20.49.03.jpeg",
  "/story/photo_2025-05-14 20.49.05.jpeg",
  "/story/photo_2025-05-14 20.49.06.jpeg",
  "/story/photo_2025-05-14 20.49.08.jpeg",
  "/story/photo_2025-05-14 20.49.10.jpeg", // Last photo
]

export function FounderPhotos() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Preload all images to prevent flickering
  useEffect(() => {
    // Create image objects and set src to preload
    photos.forEach((src) => {
      const img = new Image()
      img.src = src
    })
  }, [])

  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % photos.length)
      }, 1000) // Ultra fast transitions - like a GIF
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPaused])

  return (
    <div
      className="relative w-full sticky top-32"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Static bottom card that never moves */}
      <div className="absolute right-8 top-8 w-[280px] h-[400px] z-0">
        <div className="w-full h-full bg-card p-3 rounded-xl shadow-md transform -rotate-3 border border-border/30">
          <div className="w-full h-[85%] relative rounded-lg overflow-hidden">
            <img
              src="/story/photo_2025-05-14 20.49.00.jpeg"
              alt="Static founder photo"
              className="w-full h-full object-cover opacity-70"
              loading="eager"
            />
          </div>
        </div>
      </div>

      {/* Animated top card - GIF-like animation */}
      <div className="absolute right-0 w-[280px] h-[400px] z-10">
        <div className="w-full h-full bg-card p-3 rounded-xl shadow-lg transform rotate-6 hover:rotate-0 transition-transform duration-300 border border-border/50">
          <div className="w-full h-[85%] relative rounded-lg overflow-hidden">
            {/* Hide/show instead of re-rendering to prevent flickering */}
            {photos.map((photo, index) => (
              <div
                key={index}
                className="absolute inset-0 w-full h-full"
                style={{
                  opacity: index === currentIndex ? 1 : 0,
                  // Disable transitions to prevent flickering
                  transition: "none",
                  pointerEvents: "none", // Prevent clicks from triggering flashes
                }}
              >
                <img
                  src={photo}
                  alt="Founder photo"
                  className="w-full h-full object-cover"
                  loading="eager"
                  draggable="false"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
