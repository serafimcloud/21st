interface PreviewPaneProps {
  previewURL: string | null
}

export function PreviewPane({ previewURL }: PreviewPaneProps) {
  if (!previewURL) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Waiting for dev server...
      </div>
    )
  }

  return <iframe src={previewURL} className="w-full h-full border rounded" />
}
