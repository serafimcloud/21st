"use client"

import { BundlesLayout } from "@/components/features/bundles/bundles-layout"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { User } from "@/types/global"

export function BundlesClient({ user }: { user: User }) {
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-sm font-medium">Bundles</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Create and manage your bundles
          </p>
        </div>
      </div>
      <Alert>
        <AlertTitle>Bundles are currently in Beta</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          To add new bundles, please contact us on{" "}
          <a
            href="https://discord.gg/Qx4rFunHfm"
            target="_blank"
            className="underline"
          >
            Discord
          </a>{" "}
          or{" "}
          <a href="mailto:support@21st.dev" className="underline">
            support@21st.dev
          </a>
        </AlertDescription>
      </Alert>
      <div className="mt-4">
        <BundlesLayout authorId={user.id} hideStatus={true} />
      </div>
    </>
  )
}
