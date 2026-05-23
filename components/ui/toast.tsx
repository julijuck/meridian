"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const toastVariants = cva(
  "pointer-events-auto relative flex w-full items-center justify-between gap-4 rounded-lg border p-4 shadow-lg animate-fade-in",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 bg-destructive/5 text-destructive dark:border-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  title: string
  description?: string
  onClose?: () => void
}

function Toast({
  className,
  variant,
  title,
  description,
  onClose,
  ...props
}: ToastProps) {
  return (
    <div className={cn(toastVariants({ variant }), className)} {...props}>
      <div className="flex flex-col gap-1">
        <div className="text-sm font-semibold">{title}</div>
        {description && (
          <div className="text-sm text-muted-foreground">{description}</div>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="rounded-md p-1 hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export { Toast, toastVariants }
