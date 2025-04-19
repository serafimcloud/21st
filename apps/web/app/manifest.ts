import { MetadataRoute } from "next"
import { SITE_NAME, SITE_SLOGAN } from "@/lib/constants"
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} - ${SITE_SLOGAN}`,
    short_name: `${SITE_NAME}`,
    description:
      "Ship polished UIs faster with ready-to-use React Tailwind components inspired by shadcn/ui.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#09090B",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  }
}
