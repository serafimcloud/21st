import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { useRouter } from "next/navigation"
import { useHotkeys } from "react-hotkeys-hook"
import { Check } from "lucide-react"

export function PayWall() {
  const router = useRouter()

  const handleSubscribe = () => {
    router.push("/pricing")
  }

  useHotkeys(
    ["meta+enter", "ctrl+enter"],
    () => {
      handleSubscribe()
    },
    { preventDefault: true },
  )

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 pointer-events-none bg-grid-purple" />
      <div className="relative z-10 h-full w-full overflow-hidden rounded-sm flex flex-col items-center justify-between p-4 text-center">
        <div className="flex-1 w-full flex flex-col items-center justify-center translate-y-[20%]">
          <div className="space-y-2 mb-8">
            <h3 className="text-xl font-semibold">Premium Component</h3>
            <p className="text-muted-foreground">
              Subscribe to access this premium component and many others.
            </p>
          </div>

          <Button
            onClick={handleSubscribe}
            className="flex items-center justify-center gap-1.5 pr-1.5"
          >
            Subscribe Now
            <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans text-[11px] text-muted leading-none opacity-100 flex">
              <span className="text-[11px] leading-none font-sans">
                {navigator?.platform?.toLowerCase()?.includes("mac")
                  ? "⌘"
                  : "Ctrl"}
              </span>
              <Icons.enter className="h-2.5 w-2.5" />
            </kbd>
          </Button>
        </div>

        <div className="w-full border rounded-lg p-6 mt-8 text-start">
          <h4 className="text-sm font-medium mb-6">What's included</h4>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm">Premium Components</span>
                <span className="text-xs text-muted-foreground">Up to 10 components per month</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm">AI Component Generation</span>
                <span className="text-xs text-muted-foreground">Up to 50 generations per month</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm">Priority Support</span>
                <span className="text-xs text-muted-foreground">Get help when you need it</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
