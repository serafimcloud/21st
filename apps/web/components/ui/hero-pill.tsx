import { cn } from "@/lib/utils"

interface HeroPillProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  text: string
  className?: string
  /**
   * @default true
   */
  animate?: boolean
}

export function HeroPill({
  icon,
  text,
  className,
  animate = true,
  ...props
}: HeroPillProps) {
  return (
    <div
      className={cn("mb-4", animate && "animate-slide-up-fade", className)}
      {...props}
    >
      <p className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-white/10 backdrop-blur-[1px] px-3 py-1 text-sm font-medium text-white hover:bg-white/20 transition-colors">
        {icon && (
          <span className="mr-2 flex shrink-0 border-r border-white/20 pr-2">
            {icon}
          </span>
        )}
        {text}
      </p>
    </div>
  )
}

export function StarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={12}
      height={12}
      fill="none"
      className="transition-transform group-hover:scale-110 duration-300"
    >
      <path
        className="fill-white"
        d="M6.958.713a1 1 0 0 0-1.916 0l-.999 3.33-3.33 1a1 1 0 0 0 0 1.915l3.33.999 1 3.33a1 1 0 0 0 1.915 0l.999-3.33 3.33-1a1 1 0 0 0 0-1.915l-3.33-.999-1-3.33Z"
      />
    </svg>
  )
}

export function HeroPillDemo() {
  return (
    <div className="space-y-4">
      <HeroPill icon={<StarIcon />} text="New releases every week" />

      <HeroPill
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            className="fill-zinc-500"
          >
            <path d="M12 2L1 21h22L12 2z" />
          </svg>
        }
        text="Custom Icon Pill"
      />
    </div>
  )
}
