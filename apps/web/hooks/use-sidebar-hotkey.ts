import { useHotkeys } from "react-hotkeys-hook"
import { useAtom } from "jotai"
import { sidebarOpenAtom } from "@/lib/atoms/sidebar"

export function useSidebarHotkey() {
  const [, setSidebarOpen] = useAtom(sidebarOpenAtom)

  useHotkeys(
    "s",
    (e) => {
      e.preventDefault()
      setSidebarOpen((prev) => !prev)
    },
    {
      enableOnFormTags: false,
      preventDefault: true,
    },
  )
}
