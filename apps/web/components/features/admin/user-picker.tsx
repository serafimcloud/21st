"use client"

import { Spinner } from "@/components/icons/spinner"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useDebouncedState } from "@/hooks/use-debounced-state"
import { getUsersAction } from "@/lib/api/users"
import { useQuery } from "@tanstack/react-query"
import { CommandLoading } from "cmdk"
import { useMemo, useState } from "react"

export function UserPicker({
  onSelect,
  disabled,
}: {
  onSelect: (userId: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, debouncedSearch, setSearch] = useDebouncedState<string>(
    "",
    1000,
  )

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", debouncedSearch],
    queryFn: async () => {
      if (debouncedSearch.length === 0) {
        return []
      }
      return await getUsersAction({
        searchQuery: debouncedSearch,
      })
    },
  })

  const options = useMemo(() => {
    return (
      users?.map((user) => ({
        value: user.id,
        user,
      })) ?? []
    )
  }, [users])

  const handleUserSelect = async (value: string) => {
    onSelect(value)
    setOpen(false)
  }

  // Editable dropdown with search
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          Transfer ownership
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-0 w-[300px]">
        <Command shouldFilter={false} className="max-h-[200px]">
          <CommandInput
            placeholder="Search..."
            value={search}
            onValueChange={(value) => setSearch(value)}
          />
          <CommandList>
            {!isLoading && (
              <CommandEmpty>No users or empty search</CommandEmpty>
            )}
            {isLoading && (
              <CommandLoading className="flex items-center justify-center p-4">
                <Spinner size={16} />
              </CommandLoading>
            )}
            <CommandGroup>
              {options.map((option) => {
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(value) => {
                      handleUserSelect(value)
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={
                            option.user.display_image_url ??
                            option.user.image_url ??
                            ""
                          }
                        />
                      </Avatar>
                      <div className="flex flex-row gap-2">
                        <p>{option.user.username}</p>
                        <p className="text-muted-foreground">
                          {option.user.display_username}
                        </p>
                      </div>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
