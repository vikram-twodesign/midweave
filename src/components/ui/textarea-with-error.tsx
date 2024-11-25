import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface TextareaWithErrorProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

const TextareaWithError = forwardRef<HTMLTextAreaElement, TextareaWithErrorProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <Textarea
          className={cn(
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-500">
            {error}
          </p>
        )}
      </div>
    )
  }
)
TextareaWithError.displayName = "TextareaWithError"

export { TextareaWithError }