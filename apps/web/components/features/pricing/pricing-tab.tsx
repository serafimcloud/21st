"use client"

import * as React from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useAtom } from "jotai"
import { atom } from "jotai"

export type PricingFrequency = "monthly" | "yearly"

export const pricingFrequencyAtom = atom<PricingFrequency>("yearly")

interface TabProps {
  text: string
  selected: boolean
  setSelected: (text: string) => void
  discount?: boolean
}

export function PricingTab({
  text,
  selected,
  setSelected,
  discount = false,
}: TabProps) {
  return (
    <button
      onClick={() => setSelected(text)}
      className={cn(
        "relative w-fit pl-4 pr-2 py-2 text-sm font-semibold capitalize",
        selected
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground/80",
        "transition-all duration-300 ease-out",
        discount && "flex items-center justify-center gap-2.5",
      )}
    >
      <span className={cn("relative z-10 transition-transform duration-300")}>
        {text}
      </span>
      {selected && (
        <motion.span
          layoutId="pricing-tab"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            mass: 1,
          }}
          className="absolute inset-0 z-0 rounded-full bg-background shadow-[0_2px_15px] shadow-black/5 backdrop-blur-sm"
        />
      )}
      {discount && (
        <Badge
          variant="outline"
          className={cn(
            "border-0 z-10 bg-emerald-500/20 text-emerald-500 text-[10px] h-5 px-1.5 font-bold transition-all duration-300",
          )}
        >
          Save 33%
        </Badge>
      )}
    </button>
  )
}

interface TabsProps {
  options: readonly string[]
  discountOption?: string
}

export function PricingTabs({ options, discountOption }: TabsProps) {
  const [frequency, setFrequency] = useAtom(pricingFrequencyAtom)

  return (
    <div className="inline-flex items-center rounded-full p-1 bg-muted/80 backdrop-blur-sm">
      {options.map((option) => (
        <PricingTab
          key={option}
          text={option}
          selected={frequency === option}
          setSelected={(value) => setFrequency(value as PricingFrequency)}
          discount={option === discountOption}
        />
      ))}
    </div>
  )
}
