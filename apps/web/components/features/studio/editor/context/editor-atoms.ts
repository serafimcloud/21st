import { atom } from "jotai"
import { ActionRequiredDetails } from "./editor-types"

/**
 * Atoms for editor state management (single source of truth)
 */

// File state atoms
export const activeFileAtom = atom<string | null>(null)
export const userModifiedFilesAtom = atom<Record<string, boolean>>({})
export const loadingComponentsAtom = atom<string[]>([])

// Preview state atom
export const previewReadyAtom = atom<boolean>(false)

// Action required atoms
export const actionRequiredFilesAtom = atom<
  Record<string, ActionRequiredDetails>
>({})
export const actionRequiredPathsAtom = atom<string[]>([])
