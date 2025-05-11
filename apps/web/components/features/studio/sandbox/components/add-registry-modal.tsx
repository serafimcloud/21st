import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useFeaturedDemos } from "@/lib/queries"
import { DemoWithComponent } from "@/types/global"
import { ComponentCard } from "@/components/features/list-card/card"
import { ComponentCardSkeleton } from "@/components/ui/skeletons"

interface AddRegistryModalProps {
  isOpen: boolean
  onClose: () => void
  onAddComponent: (component: DemoWithComponent) => void
}

export function AddRegistryModal({
  isOpen,
  onClose,
  onAddComponent,
}: AddRegistryModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const featuredDemosQuery = useFeaturedDemos()

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    // Implement search logic here (this will likely hide featured demos when typing)
  }

  const handleSelectComponent = (component: DemoWithComponent) => {
    onAddComponent(component)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add from Registry</DialogTitle>
          <DialogDescription>
            Search for components in the registry or select from our featured
            components.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="Search components..."
            value={searchTerm}
            onChange={handleSearch}
          />
          <div className="h-96 border rounded-md p-2 overflow-y-auto">
            {searchTerm && (
              <p className="text-sm text-muted-foreground p-4 text-center">
                Searching for: {searchTerm}...
              </p>
            )}
            {!searchTerm && featuredDemosQuery.isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                {[...Array(4)].map((_, i) => (
                  <ComponentCardSkeleton key={i} />
                ))}
              </div>
            )}
            {!searchTerm && featuredDemosQuery.error && (
              <p className="text-sm text-destructive p-4 text-center">
                Error loading featured components.
              </p>
            )}
            {!searchTerm &&
              featuredDemosQuery.data?.data &&
              featuredDemosQuery.data.data.length === 0 && (
                <p className="text-sm text-muted-foreground p-4 text-center">
                  No featured components available.
                </p>
              )}
            {!searchTerm &&
              featuredDemosQuery.data?.data &&
              featuredDemosQuery.data.data.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                  {featuredDemosQuery.data.data.map((component) => (
                    <ComponentCard
                      key={component.id}
                      demo={component}
                      onClick={() => handleSelectComponent(component)}
                      hideUser // Assuming we don't need to show user avatar in this modal
                      hideVotes // Assuming we don't need to show votes
                    />
                  ))}
                </div>
              )}
            {!searchTerm &&
              !featuredDemosQuery.isLoading &&
              !featuredDemosQuery.error &&
              !featuredDemosQuery.data?.data && (
                <p className="text-sm text-muted-foreground p-4 text-center">
                  Enter a search term to find components or browse featured
                  below.
                </p>
              )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
