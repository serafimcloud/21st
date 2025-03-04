import { cn } from "@/lib/utils"

interface CircleProgressProps {
  progress: number // value between 0 and 1
  size?: number
  strokeWidth?: number
  radius?: number
  className?: string
}

export function CircleProgress({
  progress,
  size = 22,
  strokeWidth = 3,
  radius = 8, // Set default radius to match original
  className,
}: CircleProgressProps) {
  const center = size / 2
  const circumference = 2 * Math.PI * radius

  return (
    <svg height={size} width={size} className={cn("shrink-0", className)}>
      <circle
        className="text-border"
        cx={center}
        cy={center}
        fill="transparent"
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
      <circle
        className="text-primary"
        cx={center}
        cy={center}
        fill="transparent"
        r={radius}
        stroke="currentColor"
        strokeDasharray={`${circumference}`}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
        strokeDashoffset={`${circumference * (1 - progress)}`}
      />
    </svg>
  )
}
