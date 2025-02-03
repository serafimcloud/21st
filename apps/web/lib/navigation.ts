import { Dock, Box } from "lucide-react"

type NavigationItem = {
  title: string
  href: string
  isNew?: boolean
  demoId?: number
}

type NavigationCategory = {
  title: string
  icon: any
  items: NavigationItem[]
  isNew?: boolean
}

const marketing: NavigationItem[] = [
  { title: "Announcements", href: "/s/announcement", demoId: 541 },
  { title: "Backgrounds", href: "/s/background", demoId: 1120 },
  { title: "Borders", href: "/s/border", demoId: 1135 },
  { title: "Calls to Action", href: "/s/call-to-action", demoId: 1379 },
  { title: "Clients", href: "/s/clients", demoId: 981 },
  { title: "Comparisons", href: "/s/comparison", demoId: 1466 },
  { title: "Docks", href: "/s/dock", demoId: 990 },
  { title: "Features", href: "/s/features", demoId: 1521 },
  { title: "Footers", href: "/s/footer", demoId: 1520 },
  { title: "Heroes", href: "/s/hero", demoId: 1526 },
  { title: "Hooks", href: "/s/hook", demoId: 915 },
  { title: "Images", href: "/s/image", demoId: 1018 },
  { title: "Maps", href: "/s/map", demoId: 999 },
  { title: "Navigation Menus", href: "/s/navbar-navigation", demoId: 1432 },
  { title: "Pricing Sections", href: "/s/pricing-section", demoId: 1511 },
  { title: "Scroll Areas", href: "/s/scroll-area", demoId: 857 },
  { title: "Testimonials", href: "/s/testimonials", demoId: 822 },
  { title: "Texts", href: "/s/text", demoId: 1515 },
  { title: "Videos", href: "/s/video", demoId: 651 },
].sort((a, b) => a.title.localeCompare(b.title))

const ui: NavigationItem[] = [
  { title: "Accordions", href: "/s/accordion", demoId: 1517 },
  { title: "AI Chats", href: "/s/ai-chat", isNew: true, demoId: 1437 },
  { title: "Alerts", href: "/s/alert", demoId: 341 },
  { title: "Avatars", href: "/s/avatar", demoId: 791 },
  { title: "Badges", href: "/s/badge", demoId: 513 },
  { title: "Buttons", href: "/s/button", demoId: 1346 },
  { title: "Calendars", href: "/s/calendar", isNew: true, demoId: 461 },
  { title: "Cards", href: "/s/card", demoId: 858 },
  { title: "Carousels", href: "/s/carousel", demoId: 1247 },
  { title: "Checkboxes", href: "/s/checkbox", demoId: 90 },
  { title: "Date Pickers", href: "/s/date-picker", isNew: true, demoId: 169 },
  { title: "Dialogs / Modals", href: "/s/modal-dialog", demoId: 1462 },
  { title: "Dropdowns", href: "/s/dropdown", demoId: 390 },
  { title: "Empty States", href: "/s/empty-state", demoId: 1435 },
  { title: "File Trees", href: "/s/file-tree", demoId: 1223 },
  { title: "File Uploads", href: "/s/upload-download", demoId: 377 },
  { title: "Forms", href: "/s/form", isNew: true, demoId: 918 },
  { title: "Icons", href: "/s/icons", demoId: 865 },
  { title: "Inputs", href: "/s/input", demoId: 1456 },
  { title: "Links", href: "/s/link", demoId: 1287 },
  { title: "Menus", href: "/s/menu", demoId: 1428 },
  { title: "Notifications", href: "/s/notification", isNew: true, demoId: 400 },
  { title: "Numbers", href: "/s/number", demoId: 1444 },
  { title: "Paginations", href: "/s/pagination", demoId: 453 },
  { title: "Popovers", href: "/s/popover", isNew: true, demoId: 403 },
  { title: "Radio Groups", href: "/s/radio-group", demoId: 1410 },
  { title: "Sidebars", href: "/s/sidebar", demoId: 1075 },
  { title: "Sign Ins", href: "/s/sign-in", demoId: 374 },
  { title: "Sign ups", href: "/s/registration-signup", demoId: 373 },
  { title: "Selects", href: "/s/select", demoId: 289 },
  { title: "Sliders", href: "/s/slider", demoId: 329 },
  {
    title: "Spinner Loaders",
    href: "/s/spinner-loader",
    isNew: true,
    demoId: 523,
  },
  { title: "Tables", href: "/s/table", demoId: 105 },
  { title: "Tags", href: "/s/chip-tag", demoId: 1285 },
  { title: "Tabs", href: "/s/tabs", demoId: 635 },
  { title: "Text Areas", href: "/s/textarea", demoId: 190 },
  { title: "Toasts", href: "/s/toast", demoId: 573 },
  { title: "Toggles", href: "/s/toggle", demoId: 250 },
  { title: "Tooltips", href: "/s/tooltip", demoId: 230 },
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
