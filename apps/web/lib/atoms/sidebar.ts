import { atomWithStorage } from "jotai/utils"

export const sidebarOpenAtom = atomWithStorage<boolean>("sidebar:state", false)
