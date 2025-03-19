import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:opacity-50 disabled:pointer-events-none disabled:border-primary/75 disabled:shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.15)] [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "relative cursor-pointer space-x-2 font-regular dark:text-foreground ease-out duration-200 outline-0 focus-visible:outline-4 focus-visible:outline-offset-1 border bg-gradient-to-b from-[hsl(var(--primary-gradient-start))] to-[hsl(var(--primary-gradient-end))] hover:opacity-90 text-primary-foreground border-[hsl(var(--primary-gradient-start))] focus-visible:outline-[hsl(var(--primary-gradient-start))] data-[state=open]:opacity-90 data-[state=open]:outline-[hsl(var(--primary-gradient-start))]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm shadow-black/5 hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm shadow-black/5 hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm shadow-black/5 hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 rounded-lg px-3",
        // default: "h-9 px-4 py-2",
        default: "h-8 rounded-lg px-3",
        lg: "h-10 rounded-lg px-8",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
