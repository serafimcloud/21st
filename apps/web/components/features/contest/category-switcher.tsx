"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type Category } from "./leaderboard-list"

interface CategorySwitcherProps {
  category: Category
  onCategoryChange: (category: Category) => void
}

export function CategorySwitcher({
  category,
  onCategoryChange,
}: CategorySwitcherProps) {
  return (
    <div className="sticky top-24 space-y-6">
      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="font-medium">Leaderboard Categories</h3>
        <Tabs
          value={category}
          onValueChange={(v) => onCategoryChange(v as Category)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-1 w-full h-auto">
            <TabsTrigger
              value="global"
              className="justify-start py-2 data-[state=active]:bg-primary/10"
            >
              Global
            </TabsTrigger>
            <TabsTrigger
              value="marketing"
              className="justify-start py-2 data-[state=active]:bg-primary/10"
            >
              Marketing
            </TabsTrigger>
            <TabsTrigger
              value="ui"
              className="justify-start py-2 data-[state=active]:bg-primary/10"
            >
              UI
            </TabsTrigger>
            <TabsTrigger
              value="seasonal"
              className="justify-start py-2 data-[state=active]:bg-primary/10"
            >
              Seasonal
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="font-medium">How Scoring Works</h3>
        <ul className="text-sm space-y-2 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-foreground font-medium">Votes:</span>
            <span>Direct upvotes from the community</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-foreground font-medium">Installs:</span>
            <span>Times component was downloaded or used</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-foreground font-medium">Views:</span>
            <span>Traffic to component detail page</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
