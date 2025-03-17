export function Code({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}): React.ReactElement {
  return <code className={className}>{children}</code>
}
