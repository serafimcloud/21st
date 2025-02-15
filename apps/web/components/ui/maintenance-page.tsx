"use client"

import { Icons } from "@/components/icons"
import Link from "next/link"
export function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4">
      <div className="max-w-md w-full space-y-12 text-center">
        <div className="space-y-6">
          <div className="flex justify-center">
            <svg
              width="48"
              height="48"
              viewBox="0 0 250 250"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-primary"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M125 0C194.036 0 250 55.9644 250 125C250 194.036 194.036 250 125 250C55.9644 250 0 194.036 0 125C0 55.9644 55.9644 0 125 0ZM125 50C166.421 50 200 83.5786 200 125C200 166.421 166.421 200 125 200C83.5786 200 50 166.421 50 125C50 83.5786 83.5786 50 125 50Z"
                fill="currentColor"
              />
            </svg>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">
              Under Maintenance
            </h1>
            <p className="text-xl text-muted-foreground">
              We're making some improvements to our platform.<br />
              We'll be back shortly.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Contact us at{" "}
            <Link
              href="mailto:support@21st.dev"
              className="text-primary hover:underline"
            >
              support@21st.dev
            </Link>
          </div>
          
          <Link
            href="https://discord.gg/Qx4rFunHfm"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Icons.discord className="h-5 w-5" />
            <span>Join our Discord</span>
          </Link>
        </div>
      </div>
    </div>
  )
}