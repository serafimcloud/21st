import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
  fill?: string
  className?: string
  position?: "fixed" | "flex"
}

export function Logo({
  fill = "currentColor",
  className,
  position = "fixed",
}: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        `${position} w-8 h-8 flex items-center justify-center left-4 top-3 rounded-full`,
        className
      )}
    >
      <svg
        width={24} // Adjusting to match the previous size of 60
        height={24} // Adjusting to match the previous size of 60
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 20C0 8.95431 8.95431 0 20 0C31.0457 0 40 8.95431 40 20C40 31.0457 31.5 35.5 20 40H40C40 51.0457 31.0457 60 20 60C8.95431 60 0 51.0457 0 40C0 28.9543 9.5 22 20 20H0Z"
          fill={fill}
        />
        <path
          d="M40 60C51.7324 55.0977 60 43.5117 60 30C60 16.4883 51.7324 4.90234 40 0V60Z"
          fill={fill}
        />
      </svg>
    </Link>
  )
}
