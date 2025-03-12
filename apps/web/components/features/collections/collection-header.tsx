import { CollectionWithUser } from "@/types/global"
import { UserAvatar } from "@/components/ui/user-avatar"
import Link from "next/link"

interface CollectionHeaderProps {
  collection: CollectionWithUser
}

export function CollectionHeader({ collection }: CollectionHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-2">{collection.name}</h1>
      {collection.description && (
        <p className="text-muted-foreground">{collection.description}</p>
      )}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-sm text-muted-foreground">Created by</span>
        <div className="flex items-center gap-2">
          <Link
            href={`/${collection.user_data?.display_username || collection.user_data?.username}`}
            className="text-sm font-medium pl-1 pr-2 py-1 rounded-md hover:bg-muted transition-colors flex items-center gap-2"
          >
            <UserAvatar
              user={collection.user_data}
              src={
                collection.user_data?.display_image_url ||
                collection.user_data?.image_url
              }
              alt={
                collection.user_data?.display_name ||
                collection.user_data?.name ||
                "Unknown"
              }
              size={24}
              isClickable
              skipLink
            />

            {collection.user_data?.display_name ||
              collection.user_data?.name ||
              "Unknown"}
          </Link>
        </div>
      </div>
    </div>
  )
}
