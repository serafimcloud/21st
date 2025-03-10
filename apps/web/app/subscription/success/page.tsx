import * as React from "react"
import { Banner } from "@/components/ui/banner"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, Download } from "lucide-react"
import Link from "next/link"

export default function SuccessPaymentPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto max-w-xl">
        {/* Success Banner */}
        <Banner
          variant="default"
          rounded="default"
          className="mb-8 bg-green-50 border-green-200"
          icon={<CheckCircle className="h-6 w-6 text-green-600" />}
        >
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold text-green-800">
              Payment Successful!
            </h1>
            <p className="text-green-700">Thank you for your subscription</p>
          </div>
        </Banner>

        {/* Order Details */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">
                Subscription Details
              </h2>
              <p className="text-sm text-muted-foreground">
                We've sent the confirmation to your email
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between border-b pb-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-sm text-green-600">Active</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Go to main page
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
