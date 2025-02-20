import Link from "next/link"
import Image from "next/image"
import { Eye, Download } from "lucide-react"
import { motion } from "motion/react"
import { ComponentVideoPreview } from "../list-card/card-video"
import { Database } from "@/types/supabase"
import { DemoWithComponent } from "@/types/global"

type DatabaseAuthor =
  Database["public"]["Functions"]["get_active_authors_with_top_components"]["Returns"][0]

interface DesignEngineerCardProps {
  author: DatabaseAuthor
}

export function DesignEngineerCard({ author }: DesignEngineerCardProps) {
  const totalViews = Number(author.total_views) || 0
  const totalUsages = Number(author.total_usages) || 0
  const totalDownloads = Number(author.total_downloads) || 0
  const topComponents = (author.top_components || []) as DemoWithComponent[]

  return (
    <div className="block p-[1px]">
      <div className="group relative bg-background rounded-lg shadow-base p-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-accent/10 group-hover:to-accent/20 transition-colors" />

        <div className="relative flex flex-col lg:flex-row gap-6">
          {/* Author Info Section */}
          <div className="w-full lg:w-1/2 relative z-10">
            <Link
              href={`/${author.display_username || author.username}`}
              className="block"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full shadow-base shrink-0">
                  {author.display_image_url || author.image_url ? (
                    <Image
                      src={author.display_image_url || author.image_url || ""}
                      alt={
                        author.display_name ||
                        author.name ||
                        author.username ||
                        ""
                      }
                      className="h-12 w-12 rounded-full shadow-base object-cover"
                      width={48}
                      height={48}
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full shadow-base bg-muted flex items-center justify-center">
                      <span className="text-lg font-medium">
                        {(
                          (author.display_name ||
                            author.name ||
                            author.username ||
                            "?")?.[0] || "?"
                        ).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col flex-1">
                  <div className="space-y-1 mb-4">
                    <h2 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {author.display_name || author.name || author.username}
                    </h2>
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                      {author.bio ||
                        `@${author.display_username || author.username}`}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">
                        {totalViews.toLocaleString()} views
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Download className="w-4 h-4" />
                      <span className="text-sm">
                        {(totalUsages + totalDownloads).toLocaleString()} usages
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Components Cards Section */}
          {topComponents.length > 0 && (
            <div className="w-full lg:w-1/2 relative min-h-[150px] flex justify-center">
              <div className="absolute bottom-0 translate-y-12 translate-x-12 min-420:translate-x-0 lg:translate-x-5 flex items-end">
                {topComponents.map((demo, index) => (
                  <motion.div
                    key={demo.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.3 + index * 0.15,
                      type: "spring",
                      stiffness: 100,
                    }}
                  >
                    <Link
                      href={`/${demo.component.user?.display_username || demo.component.user?.username}/${demo.component?.component_slug}/${demo.demo_slug || "default"}`}
                      className={`
                        block
                        transition-all duration-300 ease-out
                        hover:z-10
                        hover:-translate-y-5
                        ${index === 0 ? "mr-[-110px]" : ""}
                        w-[240px]
                        relative
                      `}
                    >
                      <div className="relative aspect-[4/3] mb-3">
                        <div className="absolute inset-0">
                          <div className="relative w-full h-full rounded-lg shadow-base overflow-hidden hover:z-10 group/card">
                            <div className="absolute inset-0">
                              <Image
                                src={demo.preview_url || "/placeholder.svg"}
                                alt={demo.name || ""}
                                className="object-cover"
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                priority={index === 0}
                              />
                            </div>
                            {demo.video_url && (
                              <div className="absolute inset-0">
                                <ComponentVideoPreview
                                  component={demo}
                                  demo={demo}
                                />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent pointer-events-none opacity-100 group-hover/card:opacity-0 transition-opacity duration-300">
                              <div className="absolute bottom-2 left-0 right-0 p-3">
                                <h3 className="text-white font-medium text-sm mb-0.5 line-clamp-1">
                                  {demo.component?.name}
                                </h3>
                                <p className="text-white/80 text-xs">
                                  {(demo.view_count || 0).toLocaleString()}{" "}
                                  views
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
