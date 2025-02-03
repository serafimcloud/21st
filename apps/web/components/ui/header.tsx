import Link from "next/link"
import { cn } from "@/lib/utils"
import { Icons } from "../icons"

export function HeaderServer({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/"
        className="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer bg-foreground"
      />
      {text && (
        <div className="flex items-center gap-2">
          <Icons.slash className="text-border w-[22px] h-[22px]" />
          <span className="text-[14px] font-medium">{text}</span>
        </div>
      )}
    </div>
  )
}
