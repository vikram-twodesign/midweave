import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface InputWithErrorProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const InputWithError = forwardRef<HTMLInputElement, InputWithErrorProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <Input
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
InputWithError.displayName = "InputWithError"

export { InputWithError }