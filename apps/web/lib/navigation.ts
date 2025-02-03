import { Dock, Box } from "lucide-react"

type NavigationItem = {
  title: string
  href: string
  isNew?: boolean
  demoId?: number
}

type NavigationSection = {
  title: string
  icon: any
  items: NavigationItem[]
  isNew?: boolean
}

const landingPageSections: NavigationItem[] = [
  { title: "Announcements", href: "/s/announcement", demoId: 541 },
  { title: "Backgrounds", href: "/s/background", demoId: 1120 },
  { title: "Borders", href: "/s/border", demoId: 1135 },
  { title: "Call to Action", href: "/s/call-to-action", demoId: 1379 },
  { title: "Clients", href: "/s/clients", demoId: 981 },
  { title: "Comparison", href: "/s/comparison", demoId: 1466 },
  { title: "Docks", href: "/s/dock", demoId: 990 },
  { title: "Features", href: "/s/features", demoId: 1521 },
  { title: "Footer", href: "/s/footer", demoId: 1520 },
  { title: "Hero", href: "/s/hero", demoId: 1526 },
  { title: "Hooks", href: "/s/hook", demoId: 915 },
  { title: "Images", href: "/s/image", demoId: 1018 },
  { title: "Maps", href: "/s/map", demoId: 999 },
  { title: "Navigation Menus", href: "/s/navbar-navigation", demoId: 1432 },
  { title: "Pricing", href: "/s/pricing-section", demoId: 1511 },
  { title: "Scroll Area", href: "/s/scroll-area", demoId: 857 },
  { title: "Testimonials", href: "/s/testimonials", demoId: 822 },
  { title: "Text", href: "/s/text", demoId: 1515 },
  { title: "Video", href: "/s/video", demoId: 651 },
].sort((a, b) => a.title.localeCompare(b.title))

const uiComponents: NavigationItem[] = [
  { title: "Accordion", href: "/s/accordion", demoId: 1517 },
  { title: "AI Chat", href: "/s/ai-chat", isNew: true, demoId: 1437 },
  { title: "Alert", href: "/s/alert", demoId: 341 },
  { title: "Avatar", href: "/s/avatar", demoId: 791 },
  { title: "Badge", href: "/s/badge", demoId: 513 },
  { title: "Button", href: "/s/button", demoId: 1346 },
  { title: "Calendar", href: "/s/calendar", isNew: true, demoId: 461 },
  { title: "Card", href: "/s/card", demoId: 858 },
  { title: "Carousel", href: "/s/carousel", demoId: 1247 },
  { title: "Checkbox", href: "/s/checkbox", demoId: 90 },
  { title: "Date Picker", href: "/s/date-picker", isNew: true, demoId: 169 },
  { title: "Dialog / Modal", href: "/s/modal-dialog", demoId: 1462 },
  { title: "Dropdown", href: "/s/dropdown", demoId: 390 },
  { title: "Empty State", href: "/s/empty-state", demoId: 1435 },
  { title: "File Tree", href: "/s/file-tree", demoId: 1223 },
  { title: "File Upload", href: "/s/upload-download", demoId: 377 },
  { title: "Form", href: "/s/form", isNew: true, demoId: 918 },
  { title: "Icons", href: "/s/icons", demoId: 865 },
  { title: "Input", href: "/s/input", demoId: 1456 },
  { title: "Link", href: "/s/link", demoId: 1287 },
  { title: "Menu", href: "/s/menu", demoId: 1428 },
  { title: "Notification", href: "/s/notification", isNew: true, demoId: 400 },
  { title: "Numbers", href: "/s/number", demoId: 1444 },
  { title: "Pagination", href: "/s/pagination", demoId: 453 },
  { title: "Popover", href: "/s/popover", isNew: true, demoId: 403 },
  { title: "Radio Group", href: "/s/radio-group", demoId: 1410 },
  { title: "Sidebar", href: "/s/sidebar", demoId: 1075 },
  { title: "Sign In", href: "/s/sign-in", demoId: 374 },
  { title: "Sign up", href: "/s/registration-signup", demoId: 373 },
  { title: "Select", href: "/s/select", demoId: 289 },
  { title: "Slider", href: "/s/slider", demoId: 329 },
  {
    title: "Spinner Loader",
    href: "/s/spinner-loader",
    isNew: true,
    demoId: 523,
  },
  { title: "Tables", href: "/s/table", demoId: 105 },
  { title: "Tags", href: "/s/chip-tag", demoId: 1285 },
  { title: "Tabs", href: "/s/tabs", demoId: 635 },
  { title: "Text Area", href: "/s/textarea", demoId: 190 },
  { title: "Toast", href: "/s/toast", demoId: 573 },
  { title: "Toggle", href: "/s/toggle", demoId: 250 },
  { title: "Tooltip", href: "/s/tooltip", demoId: 230 },
].sort((a, b) => a.title.localeCompare(b.title))

export const sections: NavigationSection[] = [
  {
    title: "Landing Pages",
    icon: Dock,
    items: landingPageSections,
  },
  {
    title: "UI elements",
    icon: Box,
    items: uiComponents,
  },
]
