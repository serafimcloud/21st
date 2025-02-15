import { Dock, Box } from "lucide-react"

type NavigationItem = {
  title: string
  href: string
  isNew?: boolean
  demoId?: number
  demosCount?: number
}

type NavigationCategory = {
  title: string
  icon: any
  items: NavigationItem[]
  isNew?: boolean
}

const marketing: NavigationItem[] = [
  {
    title: "Announcements",
    href: "/s/announcement",
    demoId: 541,
    demosCount: 10,
  },
  { title: "Backgrounds", href: "/s/background", demoId: 1120, demosCount: 32 },
  { title: "Borders", href: "/s/border", demoId: 1135, demosCount: 9 },
  {
    title: "Calls to Action",
    href: "/s/call-to-action",
    demoId: 1379,
    demosCount: 33,
  },
  { title: "Clients", href: "/s/clients", demoId: 981, demosCount: 13 },
  { title: "Comparisons", href: "/s/comparison", demoId: 1466, demosCount: 6 },
  { title: "Docks", href: "/s/dock", demoId: 990, demosCount: 6 },
  { title: "Features", href: "/s/features", demoId: 1521, demosCount: 33 },
  { title: "Footers", href: "/s/footer", demoId: 1520, demosCount: 13 },
  { title: "Heroes", href: "/s/hero", demoId: 1526, demosCount: 67 },
  { title: "Hooks", href: "/s/hook", demoId: 915, demosCount: 30 },
  { title: "Images", href: "/s/image", demoId: 1018, demosCount: 21 },
  { title: "Maps", href: "/s/map", demoId: 999, demosCount: 2 },
  {
    title: "Navigation Menus",
    href: "/s/navbar-navigation",
    demoId: 1432,
    demosCount: 11,
  },
  {
    title: "Pricing Sections",
    href: "/s/pricing-section",
    demoId: 1511,
    demosCount: 16,
  },
  {
    title: "Scroll Areas",
    href: "/s/scroll-area",
    demoId: 857,
    demosCount: 21,
  },
  {
    title: "Testimonials",
    href: "/s/testimonials",
    demoId: 822,
    demosCount: 12,
  },
  { title: "Texts", href: "/s/text", demoId: 1515, demosCount: 51 },
  { title: "Videos", href: "/s/video", demoId: 651, demosCount: 5 },
].sort((a, b) => a.title.localeCompare(b.title))

const ui: NavigationItem[] = [
  { title: "Accordions", href: "/s/accordion", demoId: 1517, demosCount: 36 },
  {
    title: "AI Chats",
    href: "/s/ai-chat",
    isNew: true,
    demoId: 1437,
    demosCount: 22,
  },
  { title: "Alerts", href: "/s/alert", demoId: 341, demosCount: 22 },
  { title: "Avatars", href: "/s/avatar", demoId: 791, demosCount: 14 },
  { title: "Badges", href: "/s/badge", demoId: 513, demosCount: 20 },
  { title: "Buttons", href: "/s/button", demoId: 1346, demosCount: 115 },
  {
    title: "Calendars",
    href: "/s/calendar",
    isNew: true,
    demoId: 461,
    demosCount: 33,
  },
  { title: "Cards", href: "/s/card", demoId: 858, demosCount: 73 },
  { title: "Carousels", href: "/s/carousel", demoId: 1247, demosCount: 11 },
  { title: "Checkboxes", href: "/s/checkbox", demoId: 90, demosCount: 16 },
  {
    title: "Date Pickers",
    href: "/s/date-picker",
    isNew: true,
    demoId: 169,
    demosCount: 12,
  },
  {
    title: "Dialogs / Modals",
    href: "/s/modal-dialog",
    demoId: 1462,
    demosCount: 35,
  },
  { title: "Dropdowns", href: "/s/dropdown", demoId: 390, demosCount: 24 },
  {
    title: "Empty States",
    href: "/s/empty-state",
    demoId: 1435,
    demosCount: 1,
  },
  { title: "File Trees", href: "/s/file-tree", demoId: 1223, demosCount: 2 },
  {
    title: "File Uploads",
    href: "/s/upload-download",
    demoId: 377,
    demosCount: 6,
  },
  { title: "Forms", href: "/s/form", isNew: true, demoId: 918, demosCount: 12 },
  { title: "Icons", href: "/s/icons", demoId: 865, demosCount: 8 },
  { title: "Inputs", href: "/s/input", demoId: 1456, demosCount: 92 },
  { title: "Links", href: "/s/link", demoId: 1287, demosCount: 13 },
  { title: "Menus", href: "/s/menu", demoId: 1428, demosCount: 16 },
  {
    title: "Notifications",
    href: "/s/notification",
    isNew: true,
    demoId: 400,
    demosCount: 4,
  },
  { title: "Numbers", href: "/s/number", demoId: 1444, demosCount: 15 },
  { title: "Paginations", href: "/s/pagination", demoId: 453, demosCount: 19 },
  {
    title: "Popovers",
    href: "/s/popover",
    isNew: true,
    demoId: 403,
    demosCount: 17,
  },
  {
    title: "Radio Groups",
    href: "/s/radio-group",
    demoId: 1410,
    demosCount: 22,
  },
  { title: "Sidebars", href: "/s/sidebar", demoId: 1075, demosCount: 3 },
  { title: "Sign Ins", href: "/s/sign-in", demoId: 374, demosCount: 3 },
  {
    title: "Sign ups",
    href: "/s/registration-signup",
    demoId: 373,
    demosCount: 4,
  },
  { title: "Selects", href: "/s/select", demoId: 289, demosCount: 55 },
  { title: "Sliders", href: "/s/slider", demoId: 329, demosCount: 36 },
  {
    title: "Spinner Loaders",
    href: "/s/spinner-loader",
    isNew: true,
    demoId: 523,
    demosCount: 15,
  },
  { title: "Tables", href: "/s/table", demoId: 105, demosCount: 28 },
  { title: "Tags", href: "/s/chip-tag", demoId: 1285, demosCount: 5 },
  { title: "Tabs", href: "/s/tabs", demoId: 635, demosCount: 33 },
  { title: "Text Areas", href: "/s/textarea", demoId: 190, demosCount: 21 },
  { title: "Toasts", href: "/s/toast", demoId: 573, demosCount: 2 },
  { title: "Toggles", href: "/s/toggle", demoId: 250, demosCount: 10 },
  { title: "Tooltips", href: "/s/tooltip", demoId: 230, demosCount: 24 },
].sort((a, b) => a.title.localeCompare(b.title))

export const categories: NavigationCategory[] = [
  {
    title: "Marketing Blocks",
    icon: Dock,
    items: marketing,
  },
  {
    title: "UI Components",
    icon: Box,
    items: ui,
  },
]
