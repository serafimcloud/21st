"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()


  const navItems = [
    { name: "Dashboard", path: "/admin" },
    { name: "Submissions", path: "/admin/submissions" },
    // Add more admin nav items as needed
  ]

  return (
    <div className="min-h-screen">
      <header className="bg-gray-900 text-white">
        <div className="container mx-auto py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">21st.dev Admin</h1>
            <Link href="/" className="text-sm hover:underline">
              Back to Site
            </Link>
          </div>
        </div>
        <nav className="bg-gray-800">
          <div className="container mx-auto">
            <ul className="flex space-x-6">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`block py-3 px-2 text-sm hover:text-white transition-colors ${
                      pathname === item.path
                        ? "text-white border-b-2 border-blue-500"
                        : "text-gray-300"
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      <main>{children}</main>
    </div>
  )
}
