/**
 * Types for action required system
 */
export type ActionRequiredReason =
  | "styles"
  | "unresolved_dependencies"
  | "other"

export interface BaseActionRequiredDetails {
  reason: ActionRequiredReason
  message?: string
}

export interface StylesActionDetails extends BaseActionRequiredDetails {
  reason: "styles"
  tailwindExtensions?: Record<string, any>
  cssVariables?: Array<any>
  keyframes?: Array<any>
  utilities?: Array<any>
}

export interface UnresolvedDependenciesActionDetails
  extends BaseActionRequiredDetails {
  reason: "unresolved_dependencies"
  componentName?: string
}

export interface OtherActionDetails extends BaseActionRequiredDetails {
  reason: "other"
}

export type ActionRequiredDetails =
  | StylesActionDetails
  | UnresolvedDependenciesActionDetails
  | OtherActionDetails

/**
 * Types for the code manager context
 */
export interface CodeManagerContextType {
  // File operations
  getFileContent: (path: string) => string | undefined
  updateFileContent: (path: string, content: string) => void
  addFile: (path: string, content: string) => void
  renameFile: (oldPath: string, newPath: string) => void
  deleteFile: (path: string) => void

  // File state
  activeFile: string | null
  selectFile: (path: string | null) => void

  // File types and management
  isUnresolvedDependency: (path: string) => boolean
  getComponentName: (path: string) => string | undefined

  // File metadata
  allFiles: string[]
  unresolvedDependencies: Array<{ name: string; path: string }> | undefined

  // Loading state
  loadingComponents: string[]
  setLoadingComponents: (paths: string[]) => void

  // Action required state
  actionRequiredFiles: Record<string, ActionRequiredDetails>
  actionRequiredPaths: string[]
  markFileAsRequiringAction: (
    path: string,
    details: ActionRequiredDetails,
  ) => void
  markFileAsResolved: (path: string) => void
  isActionRequired: (path: string) => boolean
  getActionDetails: (path: string) => ActionRequiredDetails | undefined

  // Preview ready state
  previewReady: boolean
  markPreviewReady: () => void
  markPreviewNotReady: () => void
}

/**
 * Props for CodeManagerProvider
 */
export interface CodeManagerProviderProps {
  children: React.ReactNode
  initialComponentPath: string
  unresolvedDependencies?: Array<{ name: string; path: string }>
  onFileContentChange?: (path: string, content: string) => void
  isUnknownComponentFn?: (path: string) => boolean
}
