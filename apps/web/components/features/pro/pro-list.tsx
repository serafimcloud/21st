"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import Image from "next/image"
import { UserAvatar } from "@/components/ui/user-avatar"
import { ProCardSkeleton } from "@/components/ui/skeletons"
import { useClerkSupabaseClient } from "@/lib/clerk"

interface ProListProps {
  className?: string
}

export function ProList({ className }: ProListProps) {
  const supabaseWithAdminAccess = useClerkSupabaseClient()

  const { data: publishers, isLoading } = useQuery({
    queryKey: ["pro-publishers"],
    queryFn: async () => {
      const { data, error } =
        await supabaseWithAdminAccess.rpc("get_pro_publishers")

      if (error) throw error
      if (!data) return []

      const publishersWithImages = data.map((publisher) => ({
        ...publisher,
        image: publisher.pro_banner_url,
        paypal_email: null,
        role: null,
      }))

      return publishersWithImages
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 list-none pb-10">
        {Array(13)
          .fill(0)
          .map((_, index) => (
            <ProCardSkeleton key={index} />
          ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 list-none pb-10">
      {publishers?.map((publisher) => (
        <div className="p-[1px]" key={publisher.id}>
          <Link
            href={publisher.pro_referral_url!!}
            target="_blank"
            rel="noopener noreferrer"
            className="block cursor-pointer"
          >
            <div className="relative aspect-[16/10] mb-3 group">
              <div className="absolute inset-0">
                <div className="relative w-full h-full rounded-lg shadow-base overflow-hidden">
                  {publisher.image ? (
                    <Image
                      src={publisher.image}
                      alt={`${publisher.name || publisher.username}'s Pro Components`}
                      fill
                      className="object-cover object-top rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-lg">
                      <span className="text-gray-400">
                        No preview available
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-foreground/0 to-foreground/5 rounded-lg" />
                </div>
              </div>
            </div>
          </Link>
          <div className="flex space-x-3 items-center">
            <UserAvatar
              src={
                publisher.display_image_url ||
                publisher.image_url ||
                "/placeholder.svg"
              }
              alt={
                publisher.display_name ||
                publisher.name ||
                publisher.username ||
                ""
              }
              size={32}
              user={{
                ...publisher,
                is_partner: false,
                bundles_fee: 0,
                stripe_id: null,
              }}
              isClickable
            />
            <div className="flex items-center justify-between flex-grow min-w-0">
              <Link
                href={publisher.pro_referral_url || "#"}
                className="block cursor-pointer min-w-0 flex-1 mr-3"
              >
                <h2 className="text-sm font-medium text-foreground truncate">
                  {publisher.display_name ||
                    publisher.name ||
                    publisher.username}
                </h2>
              </Link>
              <Link
                target="_blank"
                href={publisher.pro_referral_url!!}
                className="text-xs text-muted-foreground whitespace-nowrap shrink-0 group/arrow"
              >
                Open{" "}
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-[2px]">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
