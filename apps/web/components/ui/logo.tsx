import Link from "next/link"

export function Logo() {
  return (
    <Link
      href="/"
      className="fixed left-4 top-3 h-8 w-8 bg-foreground rounded-full z-50"
    />
  )
}
