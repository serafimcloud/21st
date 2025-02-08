"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink } from "lucide-react"
import { TemplateWithUser } from "@/types/global"
import { formatPrice } from "@/lib/utils"

interface TemplatePreviewModalProps {
  template: TemplateWithUser | null
  isOpen: boolean
  onClose: () => void
}

export function TemplatePreviewModal({
  template,
  isOpen,
  onClose,
}: TemplatePreviewModalProps) {
  if (!template) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-[80vw] max-w-[80vw] !max-w-none h-[80vh] p-0 gap-0 overflow-hidden"
        hideCloseButton
      >
        <DialogHeader className="h-14 px-6 flex flex-row items-center justify-between border-b text-sm">
          <DialogTitle className="text-md font-medium">
            {template.name}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                window.open(template.website_preview_url, "_blank")
              }
            >
              <span>Open Preview</span>
              <ExternalLink size={16} />
            </Button>
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a
                href={template.payment_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
              >
                {template.price > 0 ? (
                  <span>Buy for {formatPrice(template.price)}</span>
                ) : (
                  <>
                    <Download size={16} />
                    <span>Download</span>
                  </>
                )}
              </a>
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 h-[calc(80vh-3.5rem)] overflow-hidden">
          <div className="w-[125%] h-[125%] origin-top-left scale-[0.8]">
            <iframe
              src={template.website_preview_url}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
