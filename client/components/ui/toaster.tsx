"use client"

import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { toasts } = useToast()
  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} {...props} variant={variant}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      {/* Centered for success, right for others */}
      {toasts.some(t => t.variant === 'success') ? (
        <ToastViewport className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center" />
      ) : (
        <ToastViewport className="fixed top-20 right-4 z-[100] flex flex-col gap-2 items-end" />
      )}
    </ToastProvider>
  )
}
