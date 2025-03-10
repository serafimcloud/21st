import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useHotkeys } from "react-hotkeys-hook"

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
    <motion.div
      layout="position"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{
        duration: 0.3,
        opacity: { duration: 0.2 },
        x: {
          type: "spring",
          stiffness: 300,
          damping: 30,
        },
      }}
      className="h-full w-full md:max-w-[30%] mi overflow-hidden rounded-lg border border-border min-w-[350px] dark:bg-[#151515] flex flex-col items-center justify-center p-6 text-center"
    >
      <h3 className="text-xl font-semibold mb-4">Premium Component</h3>
      <p className="text-muted-foreground mb-6">
        Subscribe to access this premium component and many others.
      </p>
      <Button
        onClick={handleSubscribe}
        className="flex items-center justify-center gap-1 pr-1.5"
      >
        Subscribe Now
        <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans text-[11px] text-muted leading-none opacity-100 flex">
          <span className="text-[11px] leading-none font-sans">
            {navigator?.platform?.toLowerCase()?.includes("mac") ? "⌘" : "Ctrl"}
          </span>
          <Icons.enter className="h-2.5 w-2.5" />
        </kbd>
      </Button>
    </motion.div>
  )
}
