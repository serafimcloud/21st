import { Icons } from "@/components/icons"
import Image from "next/image"
import Link from "next/link"

export function SupportedEditors() {
  return (
    <div className="pt-0 pb-20">
      <div className="text-center mb-8">
        <h2 className="text-5xl sm:text-[3.9rem]/16 pb-2 font-bold tracking-tighter text-pretty bg-clip-text text-transparent bg-gradient-to-t from-gray-300/70 to-white sm:text-balance">
          Supported IDEs
        </h2>
        <p className="mt-4 text-lg text-neutral-300">
          Use Magic with your favorite IDEs
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-lg items-center gap-x-8 gap-y-12 sm:max-w-xl sm:gap-x-10 sm:gap-y-14 lg:mx-0 lg:max-w-none sm:grid-cols-3 grid-cols-2">
          <Link
            href="https://cursor.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-3"
          >
            <div className="flex items-center gap-2">
              <Icons.cursorDark className="h-9 w-auto text-white" />
            </div>
            <span className="text-sm text-neutral-400">Cursor</span>
          </Link>

          <Link
            href="https://windsurf.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-3"
          >
            <Icons.windsurfTealLogo />
            <span className="text-sm text-neutral-400">Windsurf</span>
          </Link>

          <Link
            href="https://cline.bot/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-3 col-span-2 sm:col-span-1"
          >
            <div className="flex items-center gap-3">
              <Icons.vscode className="w-9 h-9 mr-1" />
              <span className="text-sm text-neutral-400">+</span>
              <div className="flex items-center gap-2 bg-gradient-to-b from-[#0E0F0F] to-[#0C0C0C] overflow-hidden rounded-xl border border-white/10 w-[53px] h-[53px]">
                <Image
                  src="https://avatars.githubusercontent.com/u/184127137?s=200&v=4"
                  alt="Cline"
                  width={53}
                  height={53}
                  className="mix-blend-hard-light"
                />
              </div>
            </div>
            <span className="text-sm text-neutral-400">VS Code + Cline</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
