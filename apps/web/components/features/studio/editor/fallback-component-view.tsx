import { cn } from "@/lib/utils"

interface FallbackComponentViewProps {
  componentName: string
  className?: string
}

export function FallbackComponentView({
  componentName,
  className,
}: FallbackComponentViewProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center h-full p-8 bg-background",
        className,
      )}
    >
      <div className="text-2xl font-semibold mb-4">Unknown Component</div>
      <div className="text-xl text-muted-foreground">{componentName}</div>
    </div>
  )
}
