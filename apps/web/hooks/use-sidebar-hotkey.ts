import { useHotkeys } from "react-hotkeys-hook"
import { useAtom } from "jotai"
import {
  sidebarOpenAtom,
  sidebarHintDismissedAtom,
} from "@/components/features/main-page/main-layout"

export function useSidebarHotkey() {
  const [, setSidebarOpen] = useAtom(sidebarOpenAtom)
  const [, setSidebarHintDismissed] = useAtom(sidebarHintDismissedAtom)

  useHotkeys(
    "s",
    (e) => {
      e.preventDefault()
      setSidebarOpen((prev) => !prev)
      setSidebarHintDismissed(true)
    },
    {
      enableOnFormTags: false,
      preventDefault: true,
    },
  )
}
